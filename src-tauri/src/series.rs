use std::fs::File;
use std::io::Read;
use std::path::Path;

use serde::{Deserialize, Serialize};

/// One measured point. `x` is independent, `y` is dependent, and `dx` and `dy`
/// are the uncertainties on those values.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Point {
    pub x: f64,
    pub dx: f64,
    pub y: f64,
    pub dy: f64,
}

/// The one series on the desk. Header names stay with the points so later
/// tickets can label a plot or a fit without reading the file again.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Series {
    pub x_name: String,
    pub dx_name: String,
    pub y_name: String,
    pub dy_name: String,
    pub points: Vec<Point>,
}

#[derive(Debug)]
pub enum LoadError {
    Io(std::io::Error),
    Csv(csv::Error),
    ColumnCount(usize),
    EmptyName { column: usize },
    Row { row: usize, columns: usize },
    Value { row: usize, column: usize },
}

impl std::fmt::Display for LoadError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LoadError::Io(err) => write!(f, "Could not read the file. {err}"),
            LoadError::Csv(err) => write!(f, "Could not read the CSV. {err}"),
            LoadError::ColumnCount(count) => write!(
                f,
                "The file has {count} columns. A series needs four: x, dx, y, and dy."
            ),
            LoadError::EmptyName { column } => {
                write!(f, "Column {column} in the header has no name.")
            }
            LoadError::Row { row, columns } => write!(
                f,
                "Row {row} has {columns} columns. A series needs four: x, dx, y, and dy."
            ),
            LoadError::Value { row, column } => {
                write!(f, "Row {row}, column {column} is not a number.")
            }
        }
    }
}

impl std::error::Error for LoadError {}

impl From<std::io::Error> for LoadError {
    fn from(err: std::io::Error) -> Self {
        LoadError::Io(err)
    }
}

impl From<csv::Error> for LoadError {
    fn from(err: csv::Error) -> Self {
        LoadError::Csv(err)
    }
}

/// The desk holds at most one series. A file that is not four numeric columns
/// does not become that series.
#[derive(Debug, Default)]
pub struct Desk {
    series: Option<Series>,
}

impl Desk {
    pub fn new() -> Self {
        Self { series: None }
    }

    pub fn open_csv(&mut self, path: &Path) -> Result<Series, LoadError> {
        self.series = Some(read_series(path)?);
        Ok(self.series.clone().expect("series was just stored"))
    }
}

pub fn read_series(path: &Path) -> Result<Series, LoadError> {
    read_series_from_reader(File::open(path)?)
}

fn read_series_from_reader(reader: impl Read) -> Result<Series, LoadError> {
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .flexible(true)
        .trim(csv::Trim::All)
        .from_reader(reader);

    let header = reader.headers()?.clone();
    if header.len() != 4 {
        return Err(LoadError::ColumnCount(header.len()));
    }

    let [x_name, dx_name, y_name, dy_name] = [
        header_name(&header, 0)?,
        header_name(&header, 1)?,
        header_name(&header, 2)?,
        header_name(&header, 3)?,
    ];

    let mut points = Vec::new();
    for (index, record) in reader.records().enumerate() {
        let record = record?;
        let row = index + 2;
        if record.len() != 4 {
            return Err(LoadError::Row {
                row,
                columns: record.len(),
            });
        }

        let mut values = [0.0; 4];
        for column in 0..4 {
            values[column] = record[column].parse().map_err(|_| LoadError::Value {
                row,
                column: column + 1,
            })?;
        }
        points.push(Point {
            x: values[0],
            dx: values[1],
            y: values[2],
            dy: values[3],
        });
    }

    Ok(Series {
        x_name,
        dx_name,
        y_name,
        dy_name,
        points,
    })
}

fn header_name(header: &csv::StringRecord, index: usize) -> Result<String, LoadError> {
    let mut name = header[index].to_string();
    if index == 0 {
        name = name.trim_start_matches('\u{feff}').to_string();
    }
    if name.is_empty() {
        return Err(LoadError::EmptyName { column: index + 1 });
    }
    Ok(name)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn sample(name: &str) -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .join("samples")
            .join(name)
    }

    fn write_temp(name: &str, body: &str) -> PathBuf {
        let path = std::env::temp_dir().join(format!("lab-bench-{name}"));
        std::fs::write(&path, body).unwrap();
        path
    }

    #[test]
    fn hookes_law_yields_ten_points_with_header_names() {
        let mut desk = Desk::new();
        let series = desk.open_csv(&sample("hookes-law.csv")).unwrap();

        assert_eq!(series.points.len(), 10);
        assert_eq!(series.x_name, "extension_m");
        assert_eq!(series.dx_name, "extension_unc_m");
        assert_eq!(series.y_name, "force_N");
        assert_eq!(series.dy_name, "force_unc_N");
        assert_eq!(
            series.points[0],
            Point {
                x: 0.020,
                dx: 0.001,
                y: 0.355,
                dy: 0.05
            }
        );
        assert_eq!(
            series.points[9],
            Point {
                x: 0.200,
                dx: 0.001,
                y: 3.605,
                dy: 0.05
            }
        );
        assert_eq!(desk.series.as_ref().unwrap().points.len(), 10);
    }

    #[test]
    fn capacitor_discharge_yields_seventeen_points_with_header_names() {
        let mut desk = Desk::new();
        let series = desk.open_csv(&sample("capacitor-discharge.csv")).unwrap();

        assert_eq!(series.points.len(), 17);
        assert_eq!(series.x_name, "time_s");
        assert_eq!(series.dx_name, "time_unc_s");
        assert_eq!(series.y_name, "voltage_V");
        assert_eq!(series.dy_name, "voltage_unc_V");
        assert_eq!(
            series.points[0],
            Point {
                x: 0.00,
                dx: 0.05,
                y: 4.806,
                dy: 0.03
            }
        );
        assert_eq!(
            series.points[16],
            Point {
                x: 8.00,
                dx: 0.05,
                y: 0.384,
                dy: 0.03
            }
        );
    }

    #[test]
    fn three_columns_load_nothing() {
        let path = write_temp("three.csv", "a,b,c\n1,2,3\n4,5,6\n");
        let mut desk = Desk::new();

        let err = desk.open_csv(&path).unwrap_err();

        assert!(matches!(err, LoadError::ColumnCount(3)));
        assert!(desk.series.is_none());
    }

    #[test]
    fn three_columns_do_not_replace_the_loaded_series() {
        let path = write_temp("three-after.csv", "a,b,c\n1,2,3\n");
        let mut desk = Desk::new();
        desk.open_csv(&sample("hookes-law.csv")).unwrap();

        assert!(desk.open_csv(&path).is_err());

        let series = desk.series.as_ref().unwrap();
        assert_eq!(series.points.len(), 10);
        assert_eq!(series.x_name, "extension_m");
        assert_eq!(series.y_name, "force_N");
    }
}
