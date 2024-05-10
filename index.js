const express = require('express');
const app = express()
const port = process.env.PORT || 5000;


// middleware


// server
app.get("/",async(req,res)=>{
    res.send("study loop is running no , what is this")
})
app.listen(port, ()=>{
    console.log(`the port is: ${port}`);
})



// "test": "echo \"Error: no test specified\" && exit 1"