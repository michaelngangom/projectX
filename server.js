const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const requests = require("request");
let config=require("./config.json");
let app = Express();
var cookieParser = require('cookie-parser');
var session      = require('express-session');

var flash = require('req-flash');

app.use(cookieParser());
app.use(session({ secret: '123' }));

app.use(flash());

app.use(BodyParser.urlencoded({
    extended: true
}));
app.use(BodyParser.json());


let token1,token2,authHolds,authHoldFormat,auth;
let resultAPI,resultAPITSend,allTransactions,allAccounts;

auth=config.basicAuth;
//This is how to calculate the auth string
//console.log("Basic" + new Buffer(config.username + ":" + config.password).toString("base64"));
app.use(BodyParser.urlencoded({ extended: true }));
app.set('view engine','ejs');

var CONNECTION_URL='mongodb+srv://dbadmin:mongodb123@cluster0-grfcl.mongodb.net/test?retryWrites=true';
const DATABASE_NAME = "CardToken";

app.post("/storeCredentails",(request,response)=>{
	console.log(request.body.username);
	console.log(request.body.password);
	response.send(request);
});

app.post("/createToken", (request, response) => {
    collection.insert(request.body, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
		request.flash("The card token has been saved in the database");
        response.redirect('/index');
    });
});
app.post("/getToken", (request, response) => {
    collection.find({}).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.render("../views/pages/cards",{result:result});
    });
});
//method to get the tokens for an account
function getCard(AID){
	console.log('inside the function');
	var endpoint= 'https://michael.sandbox.mambu.com/api/deposits/'+AID+'/cards';
	console.log(endpoint);
	var options = { method: 'GET',
  url: endpoint,
  headers:
   { 'cache-control': 'no-cache',
     Connection: 'keep-alive',
     Authorization: auth,
     Accept: 'application/vnd.mambu.v2+json',
     'Content-Type': 'application/json' },
   };

requests(options, function (error, response, body) {
  if (error){
	  console.log('error');
  }
	else{
		console.log('else of the function');
		token1 = JSON.parse(body);
		token2=JSON.parse(body);
	}
});
	console.log('end of the function');
}
//This is where we will get the request to pull the tokens based on an account ID
app.post('/getCards', (request, response) => {
	console.log(request.body.accountID);
	getCard(request.body.accountID);
  response.render('../views/pages/payment', {token2:token2} );
});
app.post("/webhookmambu", (req, res, next) => {

	console.log(req.body);
	collectionNotification.insert(req.body, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
    });
  res.status(200).send("OK");
});

app.get("/getToken/:id", (request, response) => {
    collection.findOne({ "_id": new ObjectId(request.params.id) }, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});
//This is where the card transaction will happen
app.post('/financialtransactions',(request,response) =>{
	let externalReferenceId= request.body.externalReferenceId;
	let externalAuthorizationReferenceId =request.body.externalAuthorizationReferenceId;
	let amount = request.body.amount;
	let cardNumber = request.body.cardToken;
	let option=request.body.select;
	switch(option){
		case "Increase":
			increase(cardNumber,externalAuthorizationReferenceId,amount);
			break;
		case "Decrease":
			decrease(cardNumber,externalAuthorizationReferenceId,amount);
			break;
		case "Reverse":
			deleteTransaction(cardNumber,externalAuthorizationReferenceId);
			break;
		case "Complete":
			complete(cardNumber,externalAuthorizationReferenceId,amount);
			break;
		default:{
     	 complete(cardNumber,externalAuthorizationReferenceId,amount);
		}
	}
	response.redirect('/index');
 });

//This is for auth hold
app.post('/authorizationholds',(request,response) =>{
	var resultAPI,resultAPITSend;
	var externalReferenceId= request.body.externalReferenceId;
	var externalAuthorizationReferenceId =request.body.externalAuthorizationReferenceId;
	var cardNumber = request.body.cardToken;
	console.log("we are in auth hold - " + cardNumber);
	var endpoint = 'https://michael.sandbox.mambu.com/api/cards/' + cardNumber + '/authorizationholds';
	var amount =request.body.amount;
	console.log(endpoint);

var options = { method: 'POST',
  url: endpoint ,
  headers:
   { 'cache-control': 'no-cache',
     Connection: 'keep-alive',
     Authorization: auth,
     Accept: 'application/vnd.mambu.v2+json',
     'Content-Type': 'application/json' },

  body: 
   { externalReferenceId: externalReferenceId,
     amount: amount,
     advice: true,
     cardAcceptor:
      { zip: 'string',
        country: 'string',
        city: 'string',
        name: 'Michael',
        state: 'string',
        mcc: 0 },
     userTransactionTime: 'string',
     currencyCode: 'EUR' },
  json: true };

requests(options, function (error, response, body) {
  if (error)
  {
	  console.log(response.body);
	  response.redirect("/index");
  }
	resultAPI =response;
});
	console.log(resultAPI);
	response.redirect('/index');
	//response.render("../views/pages/financialTransactionResult" ,{resultAPITSend:resultAPI});
 });
app.get('/index',(request,response)=>{
	response.render('pages/index');
});

//To get all the transactions on an account.
app.post('/getAllTransaction',(request,response)=>
		{
		getAllTransactions(request.body.accountAHID);
    //response.render('../views/pages/transactions', {allTransactions:allTransactions} );
		setTimeout(function(){
		console.log(allTransactions);
		response.render('../views/pages/transactions', {allTransactions:allTransactions} );
}, 4000);
});
//get all accounts
app.post('/getAccount', function(request,response){

	getAccount();
  response.render('../views/pages/depositAccounts', {allAccounts:allAccounts} );
});
//Function to get all deposit accounts on the whole platform
function getAccount(){
var options = { method: 'GET',
  url: 'https://michael.sandbox.mambu.com/api/deposits',
  headers:
   { 'cache-control': 'no-cache',
     Connection: 'keep-alive',
     Authorization: auth,
     Accept: 'application/vnd.mambu.v2+json',
     'Content-Type': 'application/json' },
};
requests(options, function (error, response, body) {
  if (error) throw new Error(error);
  console.log(response);
  allAccounts=JSON.parse(body);
});
}
//method to get all the auth hold transactions
function getAllTransactions(Account){
var endpoint = 'https://michael.sandbox.mambu.com/api/deposits/'+Account+'/transactions?detailsLevel=Full';
console.log(endpoint);

var options = { method: 'GET',
  url: endpoint,
  headers:
   { 'cache-control': 'no-cache',
     Connection: 'keep-alive',
     Authorization: auth,
     Accept: 'application/vnd.mambu.v2+json',
     'Content-Type': 'application/json' },
   };

requests(options, function (error, response, body) {
  if (error){
	  console.log('error');
  }
	else{
		allTransactions = JSON.parse(body);
	}
});
}

function getAuthHolds(Account){
var endpoint = 'https://michael.sandbox.mambu.com/api/deposits/'+Account+'/authorizationholds';
console.log(endpoint);

var options = { method: 'GET',
  url: endpoint,
  headers:
   { 'cache-control': 'no-cache',
     Connection: 'keep-alive',
     Authorization: auth,
     Accept: 'application/vnd.mambu.v2+json',
     'Content-Type': 'application/json' },
   };
requests(options, function (error, response, body) {
  if (error){
	  console.log('error');
  }
	else{
		//console.log('else of the function');
		token1 = JSON.parse(body);
		authHoldFormat=body;
 		console.log(token1 + "another same token " + authHoldFormat);
	}
});
}

//This will get all the transactions that are on AuthHold for this card.

app.post('/getAuthorizationholds', (request, response) => {

	console.log('/getAuthorizationholds');
	console.log(request.body.accountAHID);
  getAuthHolds(request.body.accountAHID);
	//var authHoldFormat=JSON.parse(authHolds);
  setTimeout(function(){
	console.log('We are done here!');
	response.render('../views/pages/authHolds', {token1:token1} );
}, 4000);
});

app.post('/linkToken',(request,response)=>{
	linkCard(request.body.accountAHID,request.body.token);
	response.redirect('/index');
});


//all methods /operations go here

function linkCard(account,token){
var options = { method: 'POST',
  url: 'https://michael.sandbox.mambu.com/api/deposits/'+account+'/cards',
  headers:
   { 'cache-control': 'no-cache',
     Connection: 'keep-alive',
     Authorization: auth,
     Accept: 'application/vnd.mambu.v2+json',
     'Content-Type': 'application/json' },
  body: { referenceToken: token },
  json: true };

requests(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
});
}

//complete auth hold transaction

function complete(cardnum,reference,amount){

	let endpoint = 'https://michael.sandbox.mambu.com/api/cards/' + cardnum + '/financialtransactions';
	console.log('complete' + endpoint);
    var options = { method: 'POST',
  url: endpoint ,
  headers:
   { 'cache-control': 'no-cache',
     Connection: 'keep-alive',
     Authorization: auth,
     Accept: 'application/vnd.mambu.v2+json',
     'Content-Type': 'application/json' },
  body:
	{
	  "externalReferenceId": reference,
	  "amount": amount,
	  "advice": true,
	  "externalAuthorizationReferenceId": reference,
	  "cardAcceptor": {
		"zip": "string",
		"country": "string",
		"city": "string",
		"name": "Michael",
		"state": "string",
		"mcc": 0
	  },
  "userTransactionTime": "string",
  "currencyCode": "EUR",
  "transactionChannelId": "cash"
},
  json: true };

requests(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
});
}

//1. Increase

function increase(cardnum,reference,amount){
	console.log("increase");
	let url='https://michael.sandbox.mambu.com/api/cards/'+cardnum+'/authorizationholds/'+reference+':increase';
	console.log(url);
var options = { method: 'POST',
  url: url,
  headers:
   { 'cache-control': 'no-cache',
     Connection: 'keep-alive',
     Authorization: auth,
     Accept: 'application/vnd.mambu.v2+json',
     'Content-Type': 'application/json' },
  body:
   { externalReferenceId: 'Testing',
     amount:amount,
     currencyCode: 'EUR' },
  json: true };

requests(options, function (error, response, body) {
  if (error) throw new Error(error);
  console.log(body);
});
}

//2.Decrease

function decrease(cardnum,reference,amount){
	let url='https://michael.sandbox.mambu.com/api/cards/'+cardnum+'/authorizationholds/'+reference+':decrease';
var options = { method: 'POST',
  url: url,
  headers:
   { 'cache-control': 'no-cache',
     Connection: 'keep-alive',
     Authorization: auth,
     Accept: 'application/vnd.mambu.v2+json',
     'Content-Type': 'application/json' },
  body:
   { externalReferenceId: 'C_003',
     amount: amount,
     currencyCode: 'EUR' },
  json: true };

requests(options, function (error, response, body) {
  if (error) throw new Error(error);
  console.log(body);
});
}

// 3. Delete
function deleteTransaction(cardnum,reference){
	let url='https://michael.sandbox.mambu.com/api/cards/'+cardnum+'/authorizationholds/'+reference;
var options = { method: 'DELETE',
  url: url,
  headers:
   { 'cache-control': 'no-cache',
     Connection: 'keep-alive',
     Authorization: auth,
     Accept: 'application/vnd.mambu.v2+json',
     'Content-Type': 'application/json' },
  json: true };

requests(options, function (error, response, body) {
  if (error) throw new Error(error);
  console.log(body);
});
}
app.listen(3000, () => {
	console.log('Server started at 3000');
	 MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("token");
		 collectionNotification=database.collection("cardNotification");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});
