use std::path::Path;
use std::sync::{Arc, OnceLock};

use resvg::tiny_skia::{self, Pixmap};
use resvg::usvg::{self, Tree};

const PNG_SIGNATURE: [u8; 8] = [0x89, b'P', b'N', b'G', b'\r', b'\n', 0x1A, b'\n'];

#[derive(Debug)]
pub enum PngError {
    Plot,
    Io(std::io::Error),
}

impl std::fmt::Display for PngError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PngError::Plot => write!(f, "The plot did not render."),
            PngError::Io(err) => write!(f, "The PNG was not written. {err}"),
        }
    }
}

impl std::error::Error for PngError {}

/// Write a PNG of the plot SVG. The SVG is the drawing on the desk.
pub fn write_svg_png(path: &Path, svg: &str) -> Result<(), PngError> {
    if !plot_marks_present(svg) {
        return Err(PngError::Plot);
    }
    let bytes = rasterize(svg)?;
    if bytes.len() < PNG_SIGNATURE.len() || bytes[..PNG_SIGNATURE.len()] != PNG_SIGNATURE {
        return Err(PngError::Plot);
    }
    std::fs::write(path, bytes).map_err(PngError::Io)
}

fn plot_marks_present(svg: &str) -> bool {
    svg.contains("data-point")
        && svg.contains("data-uncertainty=\"x\"")
        && svg.contains("data-uncertainty=\"y\"")
        && svg.contains("data-fit")
}

fn rasterize(svg: &str) -> Result<Vec<u8>, PngError> {
    let mut options = usvg::Options::default();
    options.fontdb = fonts();
    let tree = Tree::from_str(svg, &options).map_err(|_| PngError::Plot)?;
    let size = tree.size().to_int_size();
    if size.width() == 0 || size.height() == 0 || size.width() > 4096 || size.height() > 4096 {
        return Err(PngError::Plot);
    }
    let mut pixmap = Pixmap::new(size.width(), size.height()).ok_or(PngError::Plot)?;
    resvg::render(
        &tree,
        tiny_skia::Transform::default(),
        &mut pixmap.as_mut(),
    );
    pixmap.encode_png().map_err(|_| PngError::Plot)
}

fn fonts() -> Arc<usvg::fontdb::Database> {
    static FONTS: OnceLock<Arc<usvg::fontdb::Database>> = OnceLock::new();
    FONTS
        .get_or_init(|| {
            let mut db = usvg::fontdb::Database::new();
            db.load_system_fonts();
            Arc::new(db)
        })
        .clone()
}

#[cfg(test)]
mod tests {
    use super::*;

    const PLOT: &str = r##"<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 80 60">
  <rect width="80" height="60" fill="#ffffff"/>
  <line data-uncertainty="x" x1="10" y1="30" x2="50" y2="30" stroke="#24557a" stroke-width="3"/>
  <line data-uncertainty="y" x1="30" y1="8" x2="30" y2="50" stroke="#24557a" stroke-width="3"/>
  <path data-fit="" d="M8 48 L72 12" fill="none" stroke="#9a3412" stroke-width="3"/>
  <circle data-point="" cx="30" cy="30" r="4" fill="#1b1e23"/>
</svg>"##;

    fn temp_png(name: &str) -> std::path::PathBuf {
        std::env::temp_dir().join(format!("lab-bench-{name}-{}.png", std::process::id()))
    }

    fn near(pixmap: &Pixmap, x: u32, y: u32, red: u8, green: u8, blue: u8) -> bool {
        for dy in 0..4 {
            for dx in 0..4 {
                let Some(pixel) = pixmap.pixel(x + dx, y + dy) else {
                    continue;
                };
                if pixel.alpha() < 200 {
                    continue;
                }
                let dr = pixel.red() as i32 - red as i32;
                let dg = pixel.green() as i32 - green as i32;
                let db = pixel.blue() as i32 - blue as i32;
                if dr * dr + dg * dg + db * db < 50 * 50 {
                    return true;
                }
            }
        }
        false
    }

    #[test]
    fn png_file_starts_with_the_signature_and_shows_the_plot() {
        let path = temp_png("plot");
        let _ = std::fs::remove_file(&path);

        write_svg_png(&path, PLOT).unwrap();

        let bytes = std::fs::read(&path).unwrap();
        assert_eq!(&bytes[..8], &PNG_SIGNATURE);
        let pixmap = Pixmap::decode_png(&bytes).unwrap();
        assert_eq!(pixmap.width(), 80);
        assert!(near(&pixmap, 28, 28, 0x1b, 0x1e, 0x23));
        assert!(near(&pixmap, 14, 28, 0x24, 0x55, 0x7a));
        assert!(near(&pixmap, 28, 10, 0x24, 0x55, 0x7a));
        assert!(near(&pixmap, 36, 28, 0x9a, 0x34, 0x12));

        std::fs::remove_file(&path).unwrap();
    }

    #[test]
    fn a_plot_without_a_curve_is_not_written() {
        let path = temp_png("bare");
        let _ = std::fs::remove_file(&path);
        let svg = r##"<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle data-point cx="10" cy="10" r="4" fill="#1b1e23"/></svg>"##;

        let error = write_svg_png(&path, svg).unwrap_err();

        assert!(matches!(error, PngError::Plot));
        assert!(!path.exists());
    }
}
