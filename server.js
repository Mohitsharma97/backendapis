const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
var cors = require('cors');
const app = express();



var knex = require('knex')({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'test',
      database : 'facedetection'
    }
  });

 // console.log(knex.select('*').from('users'));
app.use(bodyParser.json());
app.use(cors());

const database={
    users:[
        {
           id:'123',
           name:'john',
           email:'john@gmail.com',
            password:'cookies',
           entries:0,
           joined:new Date()
        },
        {
            id:'1234',
            name:'Sally',
            email:'Sally@gmail.com',
             password:'bananas',
            entries:0,
            joined:new Date()
         }
]
// ,
// login:[{
//     id:'987',
//     hash:'',
//     email:'john@gmail.com'
// }]
}


app.get('/',(req,res)=>{
    res.send(database.users);
})

app.post('/signin',(req,res)=>{
     const {email,password} = req.body;
    if(!email||!password){
        return res.status(400).json('incorrect form Submission');
     }
    knex.select('email','hash').from('login')
    .where('email','=',req.body.email)
    .then(data=>{
      const isValid =   bcrypt.compareSync(req.body.password, data[0].hash); // true
      if(isValid){
       return knex.select('*').from('users')
       .where('email','=',req.body.email)
       .then(user=>{
           res.json(user[0])
       })   
       .catch(err=>res.status(400).json('unable to get user'))
      }else{ res.status(400).json('worng credentials')}
     
    })
    .catch(err=>res.status(400).json('wrong credentials'))
   

})



app.post('/register',(req,res)=>{

     const {email,name,password}=req.body;

     if(!email||!name||!password){
        return res.status(400).json('incorrect form submission');
     }

     var hash = bcrypt.hashSync(password);

    //  bcrypt.compareSync("bacon", hash); // true
    //  bcrypt.compareSync("veggies", hash); // false
    
    knex.transaction(trx=>{
        trx.insert({
            hash:hash,
            email:email
        })
        .into('login')
        .returning('email')
        .then(loginemail=>{
            knex('users')
            .returning('*')
            .insert({
                   email:loginemail[0],
                   name:name,
                    joined:new Date()
    })
    .then(user=>{
          res.json(user[0]);
    })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })

    
    .catch(err=>res.status(400).json('unable to register'))

   
})


app.get('/profile/:id',(req,res)=>{
    let {id} = req.params;
    knex.select('*').from('users')
    .where({id})
    .then(user=>{

        if(user.length){
            res.json(user[0]);
        }else{
            res.status(400).json('Not found');
        }
  

        
    })
    .catch(err=>res.status(400).json('Not found'))
   
})

app.put('/image',(req,res)=>{
    let {id} = req.body;
    
    knex('users')
  .where('id', '=', id)
  .increment('entries',1)
  .returning('entries')
  .then(entries=>{
      res.json(entries[0]);
  })
  .catch(err=>res.status(400).json('unable to get entries'))


})


app.listen(3000,()=>{
    console.log('app is running on port 3000');
})