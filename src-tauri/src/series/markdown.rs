use std::path::Path;

use super::Fit;

#[derive(Debug, PartialEq)]
pub enum MarkdownError {
    NoFit,
    Io(String),
}

impl std::fmt::Display for MarkdownError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MarkdownError::NoFit => write!(f, "Fit a polynomial before exporting Markdown."),
            MarkdownError::Io(err) => write!(f, "The Markdown file was not written. {err}"),
        }
    }
}

impl std::error::Error for MarkdownError {}

pub(super) fn write_fit(path: &Path, fit: &Fit) -> Result<(), MarkdownError> {
    let text = render(fit);
    std::fs::write(path, text).map_err(|err| MarkdownError::Io(err.to_string()))
}

fn render(fit: &Fit) -> String {
    let mut lines = vec![format!("Degree: {}", fit.degree), String::new()];
    for index in 0..fit.coefficients.len() {
        let coefficient = fit.coefficients[index];
        let error = fit.standard_errors.get(index).copied().unwrap_or(f64::NAN);
        lines.push(format!(
            "{}: {}, standard error {}",
            term_name(index, fit.degree),
            format_stat(coefficient),
            format_stat(error),
        ));
    }
    lines.push(String::new());
    lines.push(format!("R^2: {}", format_stat(fit.r_squared)));
    lines.push(String::new());
    lines.join("\n")
}

fn term_name(index: usize, degree: u8) -> String {
    if index == 0 {
        return "constant".to_string();
    }
    if index == 1 && degree == 1 {
        return "slope".to_string();
    }
    if index == 1 {
        return "x".to_string();
    }
    format!("x^{index}")
}

fn format_stat(value: f64) -> String {
    if !value.is_finite() {
        return "not a number".to_string();
    }
    let text = format!("{value:.10}");
    let trimmed = text.trim_end_matches('0').trim_end_matches('.');
    if trimmed.is_empty() {
        "0".to_string()
    } else {
        trimmed.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::super::Desk;
    use super::*;

    fn sample(name: &str) -> std::path::PathBuf {
        std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .join("samples")
            .join(name)
    }

    fn temp_md(name: &str) -> std::path::PathBuf {
        std::env::temp_dir().join(format!("lab-bench-{name}-{}.md", std::process::id()))
    }

    fn read_fit_file(path: &Path) -> String {
        std::fs::read_to_string(path).unwrap()
    }

    #[test]
    fn hookes_law_degree_one_file_lists_the_slope_its_error_and_r_squared() {
        let mut desk = Desk::new();
        desk.open_csv(&sample("hookes-law.csv")).unwrap();
        let fit = desk.fit_polynomial(1).unwrap();
        let path = temp_md("hooke");
        let _ = std::fs::remove_file(&path);

        desk.write_markdown(&path).unwrap();

        let text = read_fit_file(&path);
        assert!(text.contains("Degree: 1"));
        let slope_line = text
            .lines()
            .find(|line| line.starts_with("slope:"))
            .expect("slope line");
        let slope: f64 = slope_line
            .split(':')
            .nth(1)
            .unwrap()
            .split(',')
            .next()
            .unwrap()
            .trim()
            .parse()
            .unwrap();
        let error: f64 = slope_line
            .split("standard error")
            .nth(1)
            .unwrap()
            .trim()
            .parse()
            .unwrap();
        assert!((17.5..=18.5).contains(&slope));
        assert!((slope - fit.coefficients[1]).abs() < 1e-6);
        assert!((error - fit.standard_errors[1]).abs() < 1e-6);
        assert!(error > 0.0);
        assert_eq!(text.matches("R^2").count(), 1);
        let r_squared: f64 = text
            .lines()
            .find(|line| line.starts_with("R^2:"))
            .unwrap()
            .split(':')
            .nth(1)
            .unwrap()
            .trim()
            .parse()
            .unwrap();
        assert!((r_squared - fit.r_squared).abs() < 1e-6);
        assert!(!text.to_lowercase().contains("covariance"));
        std::fs::remove_file(&path).unwrap();
    }

    #[test]
    fn capacitor_markdown_has_no_time_constant() {
        let mut desk = Desk::new();
        desk.open_csv(&sample("capacitor-discharge.csv")).unwrap();
        let fit = desk.fit_polynomial(2).unwrap();
        let path = temp_md("capacitor");
        let _ = std::fs::remove_file(&path);

        desk.write_markdown(&path).unwrap();

        let text = read_fit_file(&path);
        assert!(text.contains("Degree: 2"));
        assert_eq!(text.matches("standard error").count(), fit.coefficients.len());
        assert_eq!(text.matches("R^2").count(), 1);
        let lower = text.to_lowercase();
        assert!(!lower.contains("time constant"));
        assert!(!lower.contains("covariance"));
        std::fs::remove_file(&path).unwrap();
    }

    #[test]
    fn no_fit_writes_no_file() {
        let desk = Desk::new();
        let path = temp_md("empty");
        let _ = std::fs::remove_file(&path);

        let error = desk.write_markdown(&path).unwrap_err();

        assert_eq!(error, MarkdownError::NoFit);
        assert!(!path.exists());
    }
}
