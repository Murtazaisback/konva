import PropTypes from 'prop-types';

const Shape = ({ id, color, x, y }) => {
  return (
    <div>
      <p>ID: {id}</p>
      <p>Color: {color}</p>
      <p>X: {x}</p>
      <p>Y: {y}</p>
    </div>
  );
};

Shape.propTypes = {
  id: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  x: PropTypes.number,
  y: PropTypes.number,
};

const Rectangle = ({ id, color, width, height, x, y }) => {
  return (
    <div>
      <Shape id={id} color={color} x={x} y={y} />
      <p>Width: {width}</p>
      <p>Height: {height}</p>
    </div>
  );
};

Rectangle.propTypes = {
  id: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
};

const Circle = ({ id, color, radius, x, y }) => {
  return (
    <div>
      <Shape id={id} color={color} x={x} y={y} />
      <p>Radius: {radius}</p>
    </div>
  );
};

Circle.propTypes = {
  id: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  radius: PropTypes.number.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
};

const Scribble = ({ id, color, points }) => {
  return (
    <div>
      <Shape id={id} color={color} />
      <p>Points: {points.join(', ')}</p>
    </div>
  );
};

Scribble.propTypes = {
  id: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  points: PropTypes.arrayOf(PropTypes.number).isRequired,
};

const Arrow = ({ id, color, points }) => {
  return (
    <div>
      <Shape id={id} color={color} />
      <p>Points: {points.join(', ')}</p>
    </div>
  );
};

Arrow.propTypes = {
  id: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  points: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export { Rectangle, Circle, Scribble, Arrow };
