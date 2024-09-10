import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line } from 'react-konva';

const DrawingCanvas = () => {
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const stageRef = useRef(null);

  // Load saved drawing from localStorage when the component mounts
  useEffect(() => {
    const savedLines = JSON.parse(localStorage.getItem('savedDrawing'));
    if (savedLines) {
      setLines(savedLines);
    }
  }, []);

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    setLines(lines.slice(0, lines.length - 1).concat([lastLine]));
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Save the drawing to localStorage when the user clicks "Save"
  const handleSave = () => {
    localStorage.setItem('savedDrawing', JSON.stringify(lines));
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
      {/* Save Button */}
      <button onClick={handleSave}>Save Drawing</button>
      
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
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke="black"
              strokeWidth={2}
              tension={0.5}
              lineCap="round"
              globalCompositeOperation="source-over"
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default DrawingCanvas;
