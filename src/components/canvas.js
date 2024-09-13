import React, { useCallback, useRef, useState,useEffect } from "react";
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
import { FiMenu } from "react-icons/fi";
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
  VStack,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  useDisclosure,
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
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isButtonGroupVisible, setIsButtonGroupVisible] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeOption, setActiveOption] = useState(null);
  const initialFocusRef = React.useRef()

  const toggleButtonGroupVisibility = () => {
    setIsButtonGroupVisible((prevVisible) => !prevVisible);
  };


  const undoStack = useRef([]);
  const redoStack = useRef([]);


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
          setHistory((prevHistory) => [
            ...prevHistory,
            { type: 'scribble', id }
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
          setHistory((prevHistory) => [
            ...prevHistory,
            { type: 'circle', id }
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
          setHistory((prevHistory) => [
            ...prevHistory,
            { type: 'rectangle', id }
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
          setHistory((prevHistory) => [
            ...prevHistory,
            { type: 'arrow', id }
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


 // Save canvas state in undo stack
 const saveStateToUndo = () => {
  undoStack.current.push({
    scribbles: [...scribbles],
    rectangles: [...rectangles],
    circles: [...circles],
    arrows: [...arrows],
  });
  redoStack.current = []; // Clear redo stack on new action
};

// Undo functionality
const undo = () => {
  setHistory((prevHistory) => {
    const newHistory = [...prevHistory];
    const lastItem = newHistory.pop(); // Get the last drawn shape

    if (!lastItem) return prevHistory; // If no shapes, return the same history

    // Save current state to redo stack before undoing
    redoStack.current.push({
      scribbles: [...scribbles],
      rectangles: [...rectangles],
      circles: [...circles],
      arrows: [...arrows],
    });

    // Remove the shape from the corresponding state
    switch (lastItem.type) {
      case 'scribble':
        setScribbles((prevScribbles) =>
          prevScribbles.filter((scribble) => scribble.id !== lastItem.id)
        );
        break;
      case 'circle':
        setCircles((prevCircles) =>
          prevCircles.filter((circle) => circle.id !== lastItem.id)
        );
        break;
      case 'rectangle':
        setRectangles((prevRectangles) =>
          prevRectangles.filter((rect) => rect.id !== lastItem.id)
        );
        break;
      case 'arrow':
        setArrows((prevArrows) =>
          prevArrows.filter((arrow) => arrow.id !== lastItem.id)
        );
        break;
      default:
        break;
    }

    return newHistory; // Return the updated history
  });
};


// Redo functionality
const redo = () => {
  // Check if redo stack is empty
  if (redoStack.current.length === 0) return;

  // Pop the last state from the redo stack
  const nextState = redoStack.current.pop();

  // Save the current state before performing the redo
  undoStack.current.push({
    scribbles: [...scribbles],
    rectangles: [...rectangles],
    circles: [...circles],
    arrows: [...arrows],
  });

  // Restore the shapes from the next state
  setScribbles(nextState.scribbles);
  setRectangles(nextState.rectangles);
  setCircles(nextState.circles);
  setArrows(nextState.arrows);

  // Rebuild the history after redo
  setHistory((prevHistory) => [
    ...prevHistory,
    ...nextState.scribbles.map((scribble) => ({ type: 'scribble', id: scribble.id })),
    ...nextState.rectangles.map((rectangle) => ({ type: 'rectangle', id: rectangle.id })),
    ...nextState.circles.map((circle) => ({ type: 'circle', id: circle.id })),
    ...nextState.arrows.map((arrow) => ({ type: 'arrow', id: arrow.id })),
  ]);
};


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
        {/* <IconButton aria-label="Upload image" onClick={onImportImageClick}>
          <Upload  size={14} />
        </IconButton>
        <input
          ref={fileRef}
          type="file"
          style={{ display: "none" }}
          onChange={onImportImageSelect}
        /> */}
         <Button onClick={undo} colorScheme="yellow" >
            Undo
          </Button>
          <Button onClick={redo} colorScheme="blue" >
            Redo
          </Button>
      </ButtonGroup>
      <IconButton
        icon={<FiMenu />}
        aria-label="Open Menu"
        onClick={onOpen}
        variant="outline"
        position=""
        top="10px"
        left="10px"
        zIndex="1000"
      />
       <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerBody p={0} bg="gray.700" color="">
            {/* Sidebar Vertical Options */}
            <VStack align="stretch" spacing={4} mt={10} p={4}>
              <Button
                colorScheme="blue"
                onClick={() => {
                  setActiveOption("Save");
                  saveCanvasState();
                  onClose();
                }}
              >
                Save
              </Button>

              <input
              ref={fileRef}
              type="file"
              style={{ display: "none" }}
              onChange={loadCanvasState}
            />
            <Button onClick={onImportImageClick} colorScheme="green" mb={2}>
              Load Canvas
            </Button>
              <Button onClick={toggleBackgroundColorMode} >
              {isBgColorMode ? "Reset Background" : "Change Background"}
            </Button>

              <Popover>
              <PopoverTrigger>
                <IconButton
                  aria-label="Export"
                  icon={<Download />}
                  colorScheme="blue"
                  mb={2}
                />
              </PopoverTrigger>
              <PopoverContent>
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverBody>
                  <RadioGroup onChange={setFileFormat} value={fileFormat}>
                    <Stack>
                      <Radio value="image/png" color="black">PNG</Radio>
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

              <Button
                colorScheme="red"
                onClick={() => {
                  setActiveOption("Clear");
                  onClear();
                  onClose();
                }}
              >
                Clear
              </Button>
              {isBgColorMode && (
            <Popover >
              <PopoverTrigger bg='blue.300'>
                <IconButton
                bg='blue.500'
                  aria-label="Background color picker"
                  icon={
                    <Box bg={backgroundColor} h={"32px"} w={"32px"} />
                  }
                />
              </PopoverTrigger>
              <PopoverContent width="200px"  >
                <PopoverArrow />
                <PopoverCloseButton />
                <SketchPicker 
                  color={backgroundColor}
                  onChangeComplete={onBackgroundColorChange} // Update color
                />
              </PopoverContent>
            </Popover>
          )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      

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
