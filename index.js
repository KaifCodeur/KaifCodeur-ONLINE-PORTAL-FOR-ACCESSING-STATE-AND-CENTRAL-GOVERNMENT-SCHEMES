// Import necessary modules
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

// Create an instance of Express
const app = express();

// Middleware configurations
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended:true
}));

// Connect to MongoDB database
mongoose.connect('mongodb://localhost:27017/mydb',{
    useNewUrlParser: true,
    useUnifiedTopology: true
});

var db = mongoose.connection;

db.on('error', () => console.log("Error in Connecting to Database"));
db.once('open', () => console.log("Connected to Database"));

// Define the user schema
var userSchema = new mongoose.Schema({
    name: String,
    password: String,
    searchHistory: [String],
    preferences: {
        type: Map,
        of: String
    }
});

// Create a model based on the user schema
var User = mongoose.model('User', userSchema);

// Endpoint for user signup
app.post("/sign_up",(req,res)=>{
    var name = req.body.name;
    var email = req.body.email;
    var phno = req.body.phno;
    var password = req.body.password;

    var data = {
        "name": name,
        "email" : email,
        "phno": phno,
        "password" : password
    }

    db.collection('users').insertOne(data,(err,collection)=>{
        if(err){
            throw err;
        }
        console.log("Record Inserted Successfully");
    });

    return res.redirect('signup_success.html');
});

// Endpoint for user login
app.post("/login", async (req, res) => {
    try {
        var name = req.body.name;
        var password = req.body.password;

        // Check if the provided username and password match the stored data
        const user = await User.findOne({ "name": name, "password": password });

        if (user) {
            // Store the search query from the current login in the user's search history
            var searchQuery = req.body.searchQuery; // Assuming searchQuery is sent from the frontend
            user.searchHistory.push(searchQuery);

            // Update the user's preferences (sample preferences stored as an object)
            var preferences = {
                "theme": "dark",
                "language": "english"
                // Add more preferences as needed based on user interactions or settings
            };
            user.preferences = preferences;

            // Save the updated user data with search history and preferences
            const updatedUser = await user.save();
            console.log("Search history and preferences updated for user:", updatedUser.name);

            // Provide suggestions based on the user's search history
            console.log("Suggestions based on search history:", user.searchHistory);
            // Implement your suggestion logic here using 'user.searchHistory'

            return res.redirect('csp.html'); // Redirect after successful login
        } else {
            // User not found or incorrect username/password
            return res.status(401).send("Invalid username or password");
        }
    } catch (err) {
        console.error(err);
        // Handle errors appropriately
        return res.status(500).send("Internal Server Error");
    }
});




// Default route
app.get("/", (req, res) => {
    res.set({
        "Allow-access-Allow-Origin": '*'
    });
    return res.redirect('index.html');
}).listen(3000);

console.log("Listening on PORT 3000");
