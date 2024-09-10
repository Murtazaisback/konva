import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Circle, Star } from 'react-konva';

const DrawingCanvas = () => {
  const [lines, setLines] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedShape, setSelectedShape] = useState('line'); // Default is line
  const [selectedColor, setSelectedColor] = useState('black'); // Default color is black
  const [circleRadius, setCircleRadius] = useState(30); // Default circle radius
  const [starSize, setStarSize] = useState({ innerRadius: 20, outerRadius: 40 }); // Default star size
  const stageRef = useRef(null);

  // Load saved drawing from localStorage when the component mounts
  useEffect(() => {
    const savedShapes = JSON.parse(localStorage.getItem('savedDrawing'));
    if (savedShapes) {
      setShapes(savedShapes);
    }
  }, []);

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();

    if (selectedShape === 'line') {
      setLines([...lines, { points: [pos.x, pos.y], color: selectedColor }]);
    } else if (selectedShape === 'circle') {
      setShapes([...shapes, { type: 'circle', x: pos.x, y: pos.y, radius: circleRadius, fill: selectedColor }]);
    } else if (selectedShape === 'star') {
      setShapes([...shapes, {
        type: 'star', 
        x: pos.x, 
        y: pos.y, 
        numPoints: 5, 
        innerRadius: starSize.innerRadius, 
        outerRadius: starSize.outerRadius, 
        fill: selectedColor 
      }]);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    if (selectedShape === 'line') {
      const lastLine = lines[lines.length - 1];
      lastLine.points = lastLine.points.concat([point.x, point.y]);
      setLines(lines.slice(0, lines.length - 1).concat([lastLine]));
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Save the drawing to localStorage when the user clicks "Save"
  const handleSave = () => {
    localStorage.setItem('savedDrawing', JSON.stringify(shapes));
    alert('Drawing saved!');
  };

  useEffect(() => {
    const stage = stageRef.current;
    if (stage) {
      stage.container().style.cursor = 'crosshair';
    }
  }, []);

  return (
    <div>
      {/* Draggable Panel */}
      <div className="panel" style={panelStyle}>
        <div>Choose Shape</div>
        <button onClick={() => setSelectedShape('line')}>Line</button>
        <button onClick={() => setSelectedShape('circle')}>Circle</button>
        <button onClick={() => setSelectedShape('star')}>Star</button>

        <div>Choose Color</div>
        <input 
          type="color" 
          value={selectedColor} 
          onChange={(e) => setSelectedColor(e.target.value)} 
        />

        {/* Slider for Circle Size */}
        {selectedShape === 'circle' && (
          <div>
            <label>Circle Size: {circleRadius}</label>
            <input
              type="range"
              min="10"
              max="100"
              value={circleRadius}
              onChange={(e) => setCircleRadius(Number(e.target.value))}
            />
          </div>
        )}

        {/* Sliders for Star Size */}
        {selectedShape === 'star' && (
          <div>
            <label>Star Inner Radius: {starSize.innerRadius}</label>
            <input
              type="range"
              min="10"
              max="100"
              value={starSize.innerRadius}
              onChange={(e) => setStarSize({ ...starSize, innerRadius: Number(e.target.value) })}
            />
            <label>Star Outer Radius: {starSize.outerRadius}</label>
            <input
              type="range"
              min="20"
              max="150"
              value={starSize.outerRadius}
              onChange={(e) => setStarSize({ ...starSize, outerRadius: Number(e.target.value) })}
            />
          </div>
        )}

        <button onClick={handleSave}>Save Drawing</button>
      </div>

      {/* Konva Stage */}
      <Stage
        width={window.innerWidth * 0.8}  // 80% of viewport width
        height={window.innerHeight * 0.8} // 80% of viewport height
        style={{ background: 'white' }}
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {/* Render Lines */}
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.color}
              strokeWidth={2}
              tension={0.5}
              lineCap="round"
              globalCompositeOperation="source-over"
            />
          ))}

          {/* Render Shapes */}
          {shapes.map((shape, i) => {
            if (shape.type === 'circle') {
              return (
                <Circle
                  key={i}
                  x={shape.x}
                  y={shape.y}
                  radius={shape.radius}
                  fill={shape.fill}
                />
              );
            } else if (shape.type === 'star') {
              return (
                <Star
                  key={i}
                  x={shape.x}
                  y={shape.y}
                  numPoints={shape.numPoints}
                  innerRadius={shape.innerRadius}
                  outerRadius={shape.outerRadius}
                  fill={shape.fill}
                />
              );
            }
            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default DrawingCanvas;

// Draggable Panel CSS
const panelStyle = {
  position: 'absolute',
  bottom: '10px',
  left: '0px',
  backgroundColor: 'lightgrey',
  padding: '10px',
  borderRadius: '8px',
  cursor: 'move',
};
