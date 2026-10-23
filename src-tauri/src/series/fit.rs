use serde::{Deserialize, Serialize};

use super::Series;

/// A polynomial in the measured `x`. `coefficients[0]` is the constant term.
/// The weight of each point is `1 / dy^2`. `dx` is not used.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Fit {
    pub degree: u8,
    pub coefficients: Vec<f64>,
    pub standard_errors: Vec<f64>,
    pub r_squared: f64,
}

#[derive(Debug, PartialEq)]
pub enum FitError {
    Degree,
    NoSeries,
    TooFewPoints,
    Weight,
    Singular,
}

impl std::fmt::Display for FitError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FitError::Degree => write!(f, "The degree must be 1, 2, or 3."),
            FitError::NoSeries => write!(f, "Load a series before fitting."),
            FitError::TooFewPoints => {
                write!(f, "The series does not have enough points for that degree.")
            }
            FitError::Weight => {
                write!(f, "Each point needs a positive uncertainty on y.")
            }
            FitError::Singular => write!(f, "The points do not determine that polynomial."),
        }
    }
}

impl std::error::Error for FitError {}

pub(super) fn fit_series(series: &Series, degree: u8) -> Result<Fit, FitError> {
    let terms = degree as usize + 1;
    if series.points.len() < terms + 1 {
        return Err(FitError::TooFewPoints);
    }

    let mut normal = vec![vec![0.0; terms]; terms];
    let mut rhs = vec![0.0; terms];
    let mut weight_sum = 0.0;
    let mut weighted_y = 0.0;

    for point in &series.points {
        if !point.x.is_finite() || !point.y.is_finite() || !(point.dy > 0.0) {
            return Err(FitError::Weight);
        }
        let weight = 1.0 / (point.dy * point.dy);
        let mut power = 1.0;
        let mut powers = [0.0; 4];
        for term in 0..terms {
            powers[term] = power;
            power *= point.x;
        }
        for row in 0..terms {
            rhs[row] += weight * powers[row] * point.y;
            for column in 0..terms {
                normal[row][column] += weight * powers[row] * powers[column];
            }
        }
        weight_sum += weight;
        weighted_y += weight * point.y;
    }

    let inverse = invert(&normal)?;
    let coefficients: Vec<f64> = (0..terms)
        .map(|row| {
            (0..terms)
                .map(|column| inverse[row][column] * rhs[column])
                .sum()
        })
        .collect();

    let y_mean = weighted_y / weight_sum;
    let mut residual_sum = 0.0;
    let mut total_sum = 0.0;
    for point in &series.points {
        let weight = 1.0 / (point.dy * point.dy);
        let predicted = evaluate(&coefficients, point.x);
        let residual = point.y - predicted;
        residual_sum += weight * residual * residual;
        let centered = point.y - y_mean;
        total_sum += weight * centered * centered;
    }

    let sigma_squared = residual_sum / (series.points.len() - terms) as f64;
    let standard_errors = (0..terms)
        .map(|term| (sigma_squared * inverse[term][term]).max(0.0).sqrt())
        .collect();
    let r_squared = if total_sum == 0.0 {
        1.0
    } else {
        1.0 - residual_sum / total_sum
    };

    Ok(Fit {
        degree,
        coefficients,
        standard_errors,
        r_squared,
    })
}

fn evaluate(coefficients: &[f64], x: f64) -> f64 {
    coefficients
        .iter()
        .rev()
        .fold(0.0, |value, coefficient| value * x + coefficient)
}

fn invert(matrix: &[Vec<f64>]) -> Result<Vec<Vec<f64>>, FitError> {
    let size = matrix.len();
    let mut rows = matrix.to_vec();
    let mut inverse = vec![vec![0.0; size]; size];
    for index in 0..size {
        inverse[index][index] = 1.0;
    }

    for column in 0..size {
        let mut pivot = column;
        for row in column + 1..size {
            if rows[row][column].abs() > rows[pivot][column].abs() {
                pivot = row;
            }
        }
        if rows[pivot][column].abs() < 1e-12 {
            return Err(FitError::Singular);
        }
        rows.swap(column, pivot);
        inverse.swap(column, pivot);

        let scale = rows[column][column];
        for entry in &mut rows[column] {
            *entry /= scale;
        }
        for entry in &mut inverse[column] {
            *entry /= scale;
        }

        for row in 0..size {
            if row == column {
                continue;
            }
            let factor = rows[row][column];
            for entry in 0..size {
                rows[row][entry] -= factor * rows[column][entry];
                inverse[row][entry] -= factor * inverse[column][entry];
            }
        }
    }

    Ok(inverse)
}

#[cfg(test)]
mod tests {
    use super::super::{Desk, Point, Series};
    use super::*;
    use std::path::PathBuf;

    fn sample(name: &str) -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .join("samples")
            .join(name)
    }

    fn line() -> Series {
        Series {
            x_name: "x".to_string(),
            dx_name: "dx".to_string(),
            y_name: "y".to_string(),
            dy_name: "dy".to_string(),
            points: vec![
                Point {
                    x: 0.0,
                    dx: 1.0,
                    y: 0.0,
                    dy: 1.0,
                },
                Point {
                    x: 1.0,
                    dx: 1.0,
                    y: 2.0,
                    dy: 1.0,
                },
                Point {
                    x: 2.0,
                    dx: 1.0,
                    y: 4.0,
                    dy: 1.0,
                },
            ],
        }
    }

    #[test]
    fn hookes_law_degree_one_slope_matches_the_sample() {
        let mut desk = Desk::new();
        desk.open_csv(&sample("hookes-law.csv")).unwrap();

        let fit = desk.fit_polynomial(1).unwrap();
        let slope = fit.coefficients[1];

        assert!((17.5..=18.5).contains(&slope));
        assert!(
            (slope - 18.1003).abs() < 5e-5,
            "slope {slope} is not 18.1003"
        );
        assert_eq!(fit.coefficients.len(), 2);
        assert_eq!(fit.standard_errors.len(), 2);
        assert!(fit.standard_errors.iter().all(|error| error.is_finite()));
        assert!(fit.r_squared.is_finite());
    }

    #[test]
    fn changing_dx_leaves_the_slope_unchanged() {
        let mut desk = Desk::new();
        desk.open_csv(&sample("hookes-law.csv")).unwrap();
        let slope = desk.fit_polynomial(1).unwrap().coefficients[1];

        for point in &mut desk.series.as_mut().unwrap().points {
            point.dx += 4.0;
        }
        let refit = desk.fit_polynomial(1).unwrap();

        assert_eq!(refit.coefficients[1], slope);
    }

    #[test]
    fn degree_four_does_not_replace_the_current_fit() {
        let mut desk = Desk::new();
        desk.open_csv(&sample("hookes-law.csv")).unwrap();
        let current = desk.fit_polynomial(1).unwrap();

        let error = desk.fit_polynomial(4).unwrap_err();

        assert_eq!(error, FitError::Degree);
        assert_eq!(desk.fit.as_ref(), Some(&current));
    }

    #[test]
    fn capacitor_fit_has_no_time_constant() {
        let mut desk = Desk::new();
        desk.open_csv(&sample("capacitor-discharge.csv")).unwrap();

        let fit = desk.fit_polynomial(2).unwrap();
        let value = serde_json::to_value(&fit).unwrap();
        let keys: std::collections::BTreeSet<_> =
            value.as_object().unwrap().keys().cloned().collect();

        assert_eq!(
            keys,
            ["coefficients", "degree", "r_squared", "standard_errors"]
                .into_iter()
                .map(str::to_string)
                .collect()
        );
        assert_eq!(fit.degree, 2);
        assert_eq!(fit.coefficients.len(), 3);
        assert_eq!(fit.standard_errors.len(), 3);
        assert!(
            fit.coefficients
                .iter()
                .all(|coefficient| coefficient.is_finite())
        );
        assert!(
            fit.standard_errors
                .iter()
                .all(|error| error.is_finite() && *error > 0.0)
        );
        assert!((0.0..=1.0).contains(&fit.r_squared));
    }

    #[test]
    fn weights_are_the_inverse_square_of_dy() {
        let mut series = line();
        series.points = vec![
            Point {
                x: 0.0,
                dx: 99.0,
                y: 0.0,
                dy: 1.0,
            },
            Point {
                x: 1.0,
                dx: 0.001,
                y: 0.0,
                dy: 1.0,
            },
            Point {
                x: 1.0,
                dx: 50.0,
                y: 10.0,
                dy: 0.1,
            },
        ];
        let fit = fit_series(&series, 1).unwrap();

        assert!((fit.coefficients[1] - 1000.0 / 101.0).abs() < 1e-8);
    }

    #[test]
    fn an_exact_line_has_slope_two() {
        let fit = fit_series(&line(), 1).unwrap();

        assert!((fit.coefficients[0]).abs() < 1e-10);
        assert!((fit.coefficients[1] - 2.0).abs() < 1e-10);
        assert!((fit.r_squared - 1.0).abs() < 1e-10);
    }
}
