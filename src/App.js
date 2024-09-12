
import './App.css';
import { PaintDemo } from './components/canvas';
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
