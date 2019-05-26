const express = require('express');
const app= express();
const mongoose=require('mongoose');
const cardSchema = require('./tokenSchema.js');


app.set('view engine','ejs');

var connectionString='mongodb+srv://dbadmin:mongodb123@cluster0-grfcl.mongodb.net/test?retryWrites=true';

mongoose.connect(connectionString,{
	userNewUrlParser:true,
	userCreateIndex:true
}).then(()=>{
	console.log('connected to DB');
}).catch(err=>{
	console.log('ERROR',err.message);
});


const cardModel= mongoose.model("cardModel",cardSchema);

// async function createToken(token,cardNumber) {
//   return new token({
//     token,
//     cardNumber
//   }).save();
// }


// async function findToken(token) {
//   return await User.findOne({ token });
// }


// ;(async () => {
//   const connector = mongoose.connect(connectionString);
// //  const token = process.argv[2].split('=')[1]

//   let token = await connector.then(async () => {
//     return findToken(token);
//   });

//   if (!token) {
//     token = await createToken(token);
//   }

//   console.log(token);
//   process.exit(0);
// })();


// mongoose.connect(url, function(err, db) {
//   if (err) throw err;
//   var dbo = db.db("mydb");
//   dbo.collection("customers").findOne({}, function(err, result) {
//     if (err) throw err;
//     console.log(result.name);
//     db.close();
//   });
// });

app.post("/createToken", (request, response) => {
	console.log(request);
    cardModel.create({token:request.token,cardNumber:request.cardNumber}, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(request);
    });
});


app.get('/',(req,res)=>{
	
	let cardToken=token.create({token:"C_03",cardNumber:"5555444433331112"});
		res.render('pages/index',{
			cardToken:cardToken
		});
		});

app.listen(3000,()=>{
	console.log('server on!');
});