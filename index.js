const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')
dotenv.config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())
app.use(cookieParser())

// MongoDb database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rkd0ghu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // database collection
        const assignmentsCollection = client.db('assignmentsDB').collection('assignment');
        const submitAssignmentCollection = client.db('assignmentsDB').collection('submitAssignment');

        app.post('/assignments', async (req, res) => {
            // console.log("the data is:",req.body);
            const data = req.body;
            const result = await assignmentsCollection.insertOne(data);
            res.send(result)
        })

        app.get('/assignments', async (req, res) => {
            const filter = req.query.filter;
            // console.log(filter);
            let query = {}
            if (filter) query = { diff: filter }
            const result = await assignmentsCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/assignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await assignmentsCollection.findOne(query)
            res.send(result)
        })

        app.put('/assignments/:id',async(req,res) =>{
            const id = req.params.id;
            const assignment = req.body;
            const query = {_id: new ObjectId(id)}
            const option = {upsert: true}
            const updateDoc = {
                $set: {
                    ...assignment,
                },
            }
            const result = await assignmentsCollection.updateOne(query,updateDoc,option)
            res.send(result)
        })

        app.delete('/assignments/:id', async (req, res) => {
            const id = req.params.id;
            // const dataEmail = req.query.email
            const query = { _id: new ObjectId(id) }
            const result = await assignmentsCollection.deleteOne(query)
            res.send(result)
        })
        // assignments submit 
        app.post('/submit-assignment', async (req, res) => {
            const data = req.body;
            const result = await submitAssignmentCollection.insertOne(data)
            res.send(result)
        })
        
        // app pending assignments
        app.get('/submit-assignment',async(req,res) => {            
            const result = await submitAssignmentCollection.find().toArray()
            res.send(result)
        })

        app.get('/submit-assignment/:email',async(req,res)=>{
            const email = req.params.email;
            const query = {email: email}
            const result = await submitAssignmentCollection.find(query).toArray()
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




// server
app.get("/", async (req, res) => {
    res.send("study loop is running no , what is this")
})
app.listen(port, () => {
    console.log(`the port is: ${port}`);
})



// "test": "echo \"Error: no test specified\" && exit 1"