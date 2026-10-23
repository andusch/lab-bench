export type Point = {
  x: number;
  dx: number;
  y: number;
  dy: number;
};

export type Series = {
  x_name: string;
  dx_name: string;
  y_name: string;
  dy_name: string;
  points: Point[];
};
