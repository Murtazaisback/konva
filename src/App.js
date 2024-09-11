
import './App.css';
import DrawingCanvas from './components/drawing';
import { Paint } from './components/Paint';
import { PaintDemo } from './components/PaintDemo';
import { ChakraProvider } from "@chakra-ui/react";


function App() {
  return (
    <div className='main_container'>

    <main className='main'>
     {/* <Paint/> */}
     <ChakraProvider>

     <PaintDemo/>
     </ChakraProvider>
    </main>
    </div>
  );
}

export default App;
