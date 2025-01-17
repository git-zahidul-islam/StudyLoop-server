const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')
dotenv.config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://study-loop-2a160.web.app',
        'https://study-loop-2a160.firebaseapp.com'
    ],
    credentials: true
}))
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

// middleware cookie
const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    // console.log("the token in the middleware:",token);
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized Access' })
        }
        req.user = decoded
        next()
    })
}

// cookie options
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // database collection
        const assignmentsCollection = client.db('assignmentsDB').collection('assignment');
        const submitAssignmentCollection = client.db('assignmentsDB').collection('submitAssignment');
        const userCollection = client.db('assignmentsDB').collection('userCollection');

        // auth related api [01] cookie start
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log("token get", user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res
                .cookie('token', token, cookieOptions)
                .send({ message: true })
        })
        app.post("/logout", async (req, res) => {
            console.log("cookie logout", req.body);
            res
                .clearCookie('token', { ...cookieOptions, maxAge: 0 })
                .send({ success: true })
        })

        // cookei end

        // user count api
        app.get('/user-count',async(req,res)=>{
            const assignmentCreate = await assignmentsCollection.estimatedDocumentCount()
            const user = await userCollection.estimatedDocumentCount()
            const submitAssignment = await submitAssignmentCollection.estimatedDocumentCount()
            res.send({
                assignmentCreate,
                user,
                submitAssignment
            })
        })


        app.post('/users', async (req, res) => {
            const data = req.body;

            const query = {email: data?.email}
            const existingUser = await userCollection.findOne(query)
            if(existingUser){
                return res.send({ message: 'already have user', insertedId: null})
            }

            const result = await userCollection.insertOne(data)
            res.send(result)
        })
        
        // assignments api 
        app.post('/assignments', async (req, res) => {
            const data = req.body;
            const result = await assignmentsCollection.insertOne(data);
            res.send(result)
        })

        app.get('/assignments', async (req, res) => {
            const filter = req.query.filter;
            console.log(filter);
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

        app.put('/assignments/:id', async (req, res) => {
            const id = req.params.id;
            const assignment = req.body;
            const query = { _id: new ObjectId(id) }
            const option = { upsert: true }
            const updateDoc = {
                $set: {
                    ...assignment,
                },
            }
            const result = await assignmentsCollection.updateOne(query, updateDoc, option)
            res.send(result)
        })

        app.delete('/assignments/:email', async (req, res) => {
            const userEmail = req.params?.email;
            const owner = req?.query?.email
            if (userEmail !== owner) {
                return res.send({ message: 'unAuthorized' })
            }
            const query = { email: userEmail }
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
        app.get('/pending-assignments', async (req, res) => {
            const status = req.query?.status;
            const query = { status: status }
            const result = await submitAssignmentCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/submit-assignment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await submitAssignmentCollection.findOne(query)
            res.send(result)
        })

        app.get('/my-attempt/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (req?.user?.email !== email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email }
            const result = await submitAssignmentCollection.find(query).toArray()
            res.send(result)
        })

        app.put('/give-mark/:id', async (req, res) => {
            const id = req.params.id;
            const mark = req.body;
            const query = { _id: new ObjectId(id) }
            const option = { upsert: true }
            const updateDoc = {
                $set: {
                    ...mark,
                },
            }
            const result = await submitAssignmentCollection.updateOne(query, updateDoc, option)
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


// server
app.get("/", async (req, res) => {
    res.send("study loop is running , so lets try...................")
})
app.listen(port, () => {
    console.log(`the port is: ${port}`);
})
