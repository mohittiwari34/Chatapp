const{MongoClient}=require('mongodb');
const url="mongodb+srv://mohittiwari:456Mohit@mohitcoder.ncwrxzf.mongodb.net/";

const client=new MongoClient(url);
const db_name='Chatapp';
async function Main2(message,data,from,time) {
    await client.connect();
    console.log("connected succesfully");
    const db=client.db(db_name);
    const collection=db.collection('Chatapp1');
    const insert=await collection.insertOne({type:`${message}`,data:`${from}: ${data} (${time})`});
    console.log(("inserted",insert));
    return 'done';
}
module.exports=Main2;

    