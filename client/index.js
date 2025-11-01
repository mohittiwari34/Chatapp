import React, { useState, useEffect } from "react";
import { useRef } from "react";
import { BrowserRouter,Route,Routes,Link } from "react-router";
import { createRoot } from "react-dom/client";
import Pribate from "./privateChat";
import App from "./helper";
import { ChatProvide } from "./global";
//import { io } from "socket.io-client";

 // Connect to Node server
function Main(){
  
  return(
    <BrowserRouter>
    <ChatProvide>
    <Routes>
      <Route path="/" element={<App></App>}></Route>
      <Route path="/privatchatt/:id" element={<Pribate></Pribate>}></Route>
    </Routes>
    
    </ChatProvide>
    </BrowserRouter>
  )
  
}


createRoot(document.getElementById("root")).render(<Main></Main>);
