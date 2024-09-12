import React, { useCallback, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Rect as KonvaRect,
  Image as KonvaImage,
  Circle as KonvaCircle,
  Line as KonvaLine,
  Arrow as KonvaArrow,
  Transformer,
} from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { DrawAction, PAINT_OPTIONS } from "./canvas.constants";
import { SketchPicker } from "react-color";
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  PopoverBody,
  Radio,
  RadioGroup,
  Stack,
} from "@chakra-ui/react";
import { Download, Upload, XLg } from "react-bootstrap-icons";

const SIZE = 850;
const SIZE2 = 550;
const DEFAULT_BACKGROUND_COLOR = "#fff";



//donwload image/canvas format
const downloadFile = (data, fileName, fileType) => {
  const blob = new Blob([data], { type: fileType });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
};





//opeing png/jpg/ format file in the canvas
const readUploadedFileAsText = (inputFile) => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onerror = () => {
      reader.abort();
      reject(new DOMException("Problem parsing input file."));
    };
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsText(inputFile);
  });
};

export const PaintDemo = React.memo(function Paint() {

  //hookes
  const currentShapeRef = useRef();
  const isPaintRef = useRef(false);
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const [scribbles, setScribbles] = useState([]);
  const [rectangles, setRectangles] = useState([]);
  const [circles, setCircles] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [image, setImage] = useState();
  const [color, setColor] = useState("#000");
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND_COLOR);
  const [drawAction, setDrawAction] = useState(DrawAction.Scribble);
  const [isBgColorMode, setIsBgColorMode] = useState(false);
  const [fileFormat, setFileFormat] = useState("image/png");




//able to select/deselect
  const checkDeselect = useCallback((e) => {
    const clickedOnEmpty = e.target === stageRef?.current?.find("#bg")?.[0];
    if (clickedOnEmpty) {
      transformerRef?.current?.nodes([]);
    }
  }, []);


//positioning the shapes by pointer
  const onStageMouseUp = useCallback(() => {
    isPaintRef.current = false;
  }, []);
  const onStageMouseDown = useCallback(
    (e) => {
      checkDeselect(e);

      if (drawAction === DrawAction.Select) return;
      isPaintRef.current = true;
      const stage = stageRef?.current;
      const pos = stage?.getPointerPosition();
      const x = pos?.x || 0;
      const y = pos?.y || 0;
      const id = uuidv4();
      currentShapeRef.current = id;

      switch (drawAction) {
        case DrawAction.Scribble: {
          setScribbles((prevScribbles) => [
            ...prevScribbles,
            {
              id,
              points: [x, y],
              color,
            },
          ]);
          break;
        }
        case DrawAction.Circle: {
          setCircles((prevCircles) => [
            ...prevCircles,
            {
              id,
              radius: 1,
              x,
              y,
              color,
            },
          ]);
          break;
        }
        case DrawAction.Rectangle: {
          setRectangles((prevRectangles) => [
            ...prevRectangles,
            {
              id,
              height: 1,
              width: 1,
              x,
              y,
              color,
            },
          ]);
          break;
        }
        case DrawAction.Arrow: {
          setArrows((prevArrows) => [
            ...prevArrows,
            {
              id,
              points: [x, y, x, y],
              color,
            },
          ]);
          break;
        }
      }
    },
    [checkDeselect, drawAction, color]
  );
  //positioning the shapes by pointer
  const onStageMouseMove = useCallback(() => {
    if (drawAction === DrawAction.Select || !isPaintRef.current) return;

    const stage = stageRef?.current;
    const id = currentShapeRef.current;
    const pos = stage?.getPointerPosition();
    const x = pos?.x || 0;
    const y = pos?.y || 0;

    switch (drawAction) {
      case DrawAction.Scribble: {
        setScribbles((prevScribbles) =>
          prevScribbles?.map((prevScribble) =>
            prevScribble.id === id
              ? {
                  ...prevScribble,
                  points: [...prevScribble.points, x, y],
                }
              : prevScribble
          )
        );
        break;
      }
      case DrawAction.Circle: {
        setCircles((prevCircles) =>
          prevCircles?.map((prevCircle) =>
            prevCircle.id === id
              ? {
                  ...prevCircle,
                  radius:
                    ((x - prevCircle.x) ** 2 + (y - prevCircle.y) ** 2) ** 0.5,
                }
              : prevCircle
          )
        );
        break;
      }
      case DrawAction.Rectangle: {
        setRectangles((prevRectangles) =>
          prevRectangles?.map((prevRectangle) =>
            prevRectangle.id === id
              ? {
                  ...prevRectangle,
                  height: y - prevRectangle.y,
                  width: x - prevRectangle.x,
                }
              : prevRectangle
          )
        );
        break;
      }
      case DrawAction.Arrow: {
        setArrows((prevArrows) =>
          prevArrows.map((prevArrow) =>
            prevArrow.id === id
              ? {
                  ...prevArrow,
                  points: [prevArrow.points[0], prevArrow.points[1], x, y],
                }
              : prevArrow
          )
        );
        break;
      }
    }
  }, [drawAction]);


  //shape clickers
  const onShapeClick = useCallback(
    (e) => {
      if (drawAction !== DrawAction.Select) return;
      const currentTarget = e.currentTarget;
      transformerRef?.current?.node(currentTarget);
    },
    [drawAction]
  );

  const isDraggable = drawAction === DrawAction.Select;


  
  
  
  // import png format file
  const onImportImageSelect = useCallback(
    (e) => {
      if (e.target.files?.[0]) {
        const imageURL = URL.createObjectURL(e.target.files[0]);
        const image = new Image(SIZE / 2, SIZE / 2);
        image.src = imageURL;
        setImage(image);
      }
      e.target.files = null;
    },
    []
  );
    // import png format file
  const onImportImageClick = useCallback(() => {
    fileRef?.current && fileRef?.current?.click();
  }, []);



  //download image as png/jpg/jpeg
  const onExportClick = useCallback(() => {
    const mimeType = fileFormat; // Use the selected file format (e.g., 'image/png', 'image/jpeg')
    const dataURL = stageRef?.current?.toDataURL({
      mimeType, // Correct format
      pixelRatio: 3, // Optional: Increase this to improve image quality
    });
  
    const link = document.createElement("a");
    link.href = dataURL;
  
    // Extract file extension from the selected file format and use it in the filename
    const extension = mimeType.split("/")[1];
    link.download = `canvas.${extension}`;
  
    link.click();
  }, [fileFormat]);



  //clear the whole canvas
  const onClear = useCallback(() => {
    setRectangles([]);
    setCircles([]);
    setArrows([]);
    setScribbles([]);
    setImage(undefined);
  }, []);





  //canvas background colors function
   const toggleBackgroundColorMode = () => {
    if (isBgColorMode) {
      // If background color mode is already on, reset the background color to white
      setBackgroundColor(DEFAULT_BACKGROUND_COLOR);
    }
    setIsBgColorMode((prevMode) => !prevMode); // Toggle mode
  };
  const onBackgroundColorChange = (color) => {
    setBackgroundColor(color.hex); // Update background color when color picker is used
  };
  const diagramRef = useRef(null);


  //saving canavs as json
  const saveCanvasState = useCallback(() => {
    const canvasState = {
      backgroundColor,
      rectangles,
      circles,
      scribbles,
      arrows,
    };
    const jsonData = JSON.stringify(canvasState);
    downloadFile(jsonData, "canvas-state.json", "application/json");
  }, [backgroundColor, rectangles, circles, scribbles, arrows]);



  //loading canvas as json
  const loadCanvasState = useCallback(async (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileContent = await readUploadedFileAsText(file);
      const canvasState = JSON.parse(fileContent);

      setBackgroundColor(canvasState.backgroundColor || DEFAULT_BACKGROUND_COLOR);
      setRectangles(canvasState.rectangles || []);
      setCircles(canvasState.circles || []);
      setScribbles(canvasState.scribbles || []);
      setArrows(canvasState.arrows || []);
    }
  }, []);

  const fileRef = useRef(null);

  

  return (
    <Box m={4}>
    <Flex justifyContent={"space-between"} alignItems="center">
      <ButtonGroup size="sm" isAttached variant="solid">
        {PAINT_OPTIONS.map(({ id, label, icon }) => (
          <IconButton
            key={id}
            aria-label={label}
            icon={icon}
            onClick={() => setDrawAction(id)}
            colorScheme={id === drawAction ? "whatsapp" : undefined}
          />
        ))}
        <Popover>
          <PopoverTrigger>
            <Box
              bg={color}
              h={"32px"}
              w={"32px"}
              borderRadius="sm"
              cursor="pointer"
            />
          </PopoverTrigger>
          <PopoverContent width="300">
            <PopoverArrow />
            <PopoverCloseButton />
            <SketchPicker
              color={color}
              onChangeComplete={(selectedColor) => setColor(selectedColor.hex)}
            />
          </PopoverContent>
        </Popover>
        <IconButton aria-label="Upload image" onClick={onImportImageClick}>
          <Upload  size={14} />
        </IconButton>
        <input
          ref={fileRef}
          type="file"
          style={{ display: "none" }}
          onChange={onImportImageSelect}
        />
      </ButtonGroup>
      <ButtonGroup>
      <Button onClick={saveCanvasState} colorScheme="blue">
            Save Canvas
          </Button>
          <input
            ref={fileRef}
            type="file"
            style={{ display: "none" }}
            onChange={loadCanvasState}
          />
          <Button onClick={onImportImageClick} colorScheme="green">
            Load Canvas
          </Button>
          <Popover>
  <PopoverTrigger>
    <IconButton
      aria-label="Export"
      icon={<Download />}
      colorScheme="blue"
    />
  </PopoverTrigger>
  <PopoverContent>
    <PopoverArrow />
    <PopoverCloseButton />
    <PopoverBody>
      <RadioGroup onChange={setFileFormat} value={fileFormat}>
        <Stack>
          <Radio value="image/png">PNG</Radio>
          <Radio value="image/jpeg">JPEG</Radio>
          <Radio value="image/jpg">JPG</Radio>
        </Stack>
      </RadioGroup>
      <Button
        mt={2}
        onClick={onExportClick}
        colorScheme="blue"
        width="100%"
      >
        Download
      </Button>
    </PopoverBody>
  </PopoverContent>
</Popover>
        <IconButton onClick={onClear} aria-label="Clear canvas">
          <XLg size={14} />
        </IconButton>
        <Button onClick={toggleBackgroundColorMode} className="small-text">
            {isBgColorMode ? "Reset Background" : "Change Background"}
          </Button>

          {/* Show background color icon and color picker only if background color mode is on */}
          {isBgColorMode && (
            <Popover>
              <PopoverTrigger>
                <IconButton
                  aria-label="Background color picker"
                  icon={
                    <Box bg={backgroundColor} h={"32px"} w={"32px"} />
                  }
                />
              </PopoverTrigger>
              <PopoverContent width="200px">
                <PopoverArrow />
                <PopoverCloseButton />
                <SketchPicker
                  color={backgroundColor}
                  onChangeComplete={onBackgroundColorChange} // Update color
                />
              </PopoverContent>
            </Popover>
          )}
      </ButtonGroup>
    </Flex>
    <Box
      border="1px solid black"
      mt={4}
      overflow="hidden"
      bg={backgroundColor} // Set background color
    >
      <Stage
        height={SIZE2}
        width={SIZE}
        ref={stageRef}
        onMouseUp={onStageMouseUp}
        onMouseDown={onStageMouseDown}
        onMouseMove={onStageMouseMove}
      >
        <Layer>
          <KonvaRect
            x={0}
            y={0}
            height={SIZE}
            width={SIZE}
            fill={backgroundColor} // Set background color
            id="bg"
          />
          {image && (
            <KonvaImage
              ref={diagramRef}
              image={image}
              x={0}
              y={0}
              height={SIZE / 2}
              width={SIZE / 2}
              onClick={onShapeClick}
              draggable={isDraggable}
            />
          )}
          {rectangles.map((rectangle) => (
            <KonvaRect
              key={rectangle.id}
              x={rectangle.x}
              y={rectangle.y}
              onClick={onShapeClick}
              height={rectangle.height}
              width={rectangle.width}
              stroke={rectangle.color}
              id={rectangle.id}
              strokeWidth={4}
              draggable={isDraggable}
            />
          ))}
          {circles.map((circle) => (
            <KonvaCircle
              key={circle.id}
              id={circle.id}
              x={circle.x}
              y={circle.y}
              radius={circle.radius}
              stroke={circle.color}
              strokeWidth={4}
              draggable={isDraggable}
              onClick={onShapeClick}
            />
          ))}
          {scribbles.map((scribble) => (
            <KonvaLine
              key={scribble.id}
              id={scribble.id}
              lineCap="round"
              lineJoin="round"
              stroke={scribble.color}
              strokeWidth={4}
              points={scribble.points}
              name={DrawAction.Scribble}
              onClick={onShapeClick}
              draggable={isDraggable}
            />
          ))}
          {arrows.map((arrow) => (
            <KonvaArrow
              key={arrow.id}
              id={arrow.id}
              points={arrow.points}
              fill={arrow.color}
              stroke={arrow.color}
              strokeWidth={4}
              onClick={onShapeClick}
              draggable={isDraggable}
            />
          ))}
          <Transformer ref={transformerRef} />
        </Layer>
      </Stage>
    </Box>
  </Box>
  );
});
