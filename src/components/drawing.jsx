import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Circle, Star, Rect } from 'react-konva';

const DrawingCanvas = () => {
  const [lines, setLines] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedShape, setSelectedShape] = useState('line');
  const [selectedColor, setSelectedColor] = useState('black'); // Default drawing color
  const [circleRadius, setCircleRadius] = useState(30);
  const [starSize, setStarSize] = useState({ innerRadius: 20, outerRadius: 40 });
  const [backgroundColor, setBackgroundColor] = useState('white'); // Background color state
  const [backgroundColorToggle, setBackgroundColorToggle] = useState(false); // Toggle for background mode
  const stageRef = useRef(null);
  const layerRef = useRef(null); 

  // Global variable for selected color
  window.selectedColor = selectedColor;

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

    if (backgroundColorToggle) {
      // If background color mode is active, change background color
      setBackgroundColor(window.selectedColor);
      setBackgroundColorToggle(false); // Disable background mode after change
    } else if (selectedShape === 'line') {
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

  // Function to clear a specific layer
  const clearLayer = (layer) => {
    layer.destroyChildren();
    layer.draw();
    setLines([]);
    setShapes([]);
  };

  // Event Listener for clearing the canvas
  useEffect(() => {
    const clearButton = document.getElementById('clear-canvas');
    if (clearButton) {
      clearButton.addEventListener('click', () => clearLayer(layerRef.current));
    }
    return () => {
      if (clearButton) {
        clearButton.removeEventListener('click', () => clearLayer(layerRef.current));
      }
    };
  }, []);

  // Event Listener for toggling background color change mode
  useEffect(() => {
    const backgroundColorButton = document.getElementById('background-color-icon');
    if (backgroundColorButton) {
      backgroundColorButton.addEventListener('click', () => setBackgroundColorToggle(!backgroundColorToggle));
    }
    return () => {
      if (backgroundColorButton) {
        backgroundColorButton.removeEventListener('click', () => setBackgroundColorToggle(!backgroundColorToggle));
      }
    };
  }, [backgroundColorToggle]);

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
          onChange={(e) => {
            setSelectedColor(e.target.value);
            window.selectedColor = e.target.value; // Store the color in the global variable
          }} 
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

      {/* Clear Canvas Button */}
      <span id="clear-canvas" style={{ cursor: 'pointer', marginLeft: '20px' }}>
        🧹 Clear Canvas
      </span>

      {/* Background Color Button */}
      <span id="background-color-icon" style={{ cursor: 'pointer', marginLeft: '20px' }}>
        🎨 Change Background Color
      </span>

      {/* Konva Stage */}
      <Stage
        width={window.innerWidth * 0.8}  
        height={window.innerHeight * 0.8} 
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer ref={layerRef}>
          {/* Background Rectangle */}
          <Rect 
            width={window.innerWidth * 0.8} 
            height={window.innerHeight * 0.8} 
            fill={backgroundColor} 
          />

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
  top: '20px',
  left: '20px',
  backgroundColor: 'lightgrey',
  padding: '10px',
  borderRadius: '8px',
  cursor: 'move',
};
