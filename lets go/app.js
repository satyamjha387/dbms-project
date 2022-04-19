// ---------------------------------------------------------------------------------------------
const express= require("express");
const bodyParser= require("body-parser");
const mongoose= require("mongoose");
// ---------------------------------------------------------------------------------------------
const app=express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
mongoose.connect("mongodb://localhost:27017/canteenDB",{useNewUrlParser: true});
// ---------------------------------------------------------------------------------------------
const OrderList=[];
var totalMoney=0;

const itemsSchema= new mongoose.Schema({
    Dish: String,
    price: Number
  });

const paymentSchema = new mongoose.Schema({
      cost: Number,
      mode: String,
      Status: Boolean
  })
  const customerSchema = new mongoose.Schema({
    name: String,
    phoneNo: String,
})
  const orderSchema = new mongoose.Schema({
        customer: customerSchema, 
        orderedItems: [itemsSchema],
        payment: paymentSchema
  })

  const adminSchema=new mongoose.Schema({
      loginID: String,
      password: String
  })

  const Customer = mongoose.model("Customer", customerSchema);
  const Item = mongoose.model("Item", itemsSchema);
  const Payment = mongoose.model("Payment", paymentSchema);
  const Order = mongoose.model("Order", orderSchema);
  const Admin = mongoose.model("Admin", adminSchema);
  var newCustomer = new Customer();
  var newOrder ;
// ---------------------------------------------------------------------------------------------
  
app.get("/", (req, res)=>{
    // Item.find({}).sort('Dish').exec.function(err,foundDishes)
    Item.find({}, null, {sort: {price: 1}}, function(err, foundDishes)
  {
        if(err){
            console.log("err");
        }
        else{
            res.render("list", {kindOfDay:"Today's Menu", newWork: foundDishes,priceTillNow:totalMoney,listOfDishes:OrderList});

        }

    })
})
app.post("/",(req,res)=>res.redirect("/"));

// ---------------------------------------------------------------------------------------------
app.get("/login",(req, res)=>{
    res.render("options");
})
// ---------------------------------------------------------------------------------------------
app.get("/customerInfo",(req, res)=>{
    res.render("custInfo",{title: "Add Required Fields"});
})

app.post("/customerInfo",(req, res)=>{
    const custName= req.body.customername;
    const custPhone = req.body.customerPhone;
    newCustomer=({
        name: custName,
        phoneNo: custPhone
    })

    const currentCust=new Customer({
        name: custName,
        phoneNo: custPhone
    })
    var flag=false;
    Customer.find({}, function(err, item){
        if(err)console.log(err);
        else{
        for(let i=0;i<item.length;i++){
            if(flag==false && item[i].name===custName && item[i].phoneNo===custPhone){
                flag= true;
                break;
            }   
          }
      }
        
       
    })
    if(flag==false){  
        currentCust.save();
    }
    res.redirect("/");
    
})
// ---------------------------------------------------------------------------------------------
app.post("/addOrder",(req, res)=>{
    var orderitem=req.body.checkbox;
    
   Item.findOne({_id:orderitem}, function(err,item){
       if(err){console.log(err);}
       else{
        OrderList.push(item);
           totalMoney+=item.price;

           }
   })
    res.redirect("/");
})
// ---------------------------------------------------------------------------------------------
app.post("/decrementOrder",(req, res)=>{
    if(OrderList.length==0)res.redirect("/orderSubmit");
    const reqID = req.body.decrement;
    for(let i =0;i<OrderList.length;i++){
        if(OrderList[i]._id==reqID){
             totalMoney-=OrderList[i].price;
            OrderList.splice(i,1);
            break;
        }
    }
    res.redirect("/orderSubmit");
})

// ---------------------------------------------------------------------------------------------

app.get("/orderSubmit",(req, res)=>{
    res.render("orders", {priceTillNow:totalMoney,listOfDishes:OrderList});
})

app.post("/orderSubmit", (req, res)=>{
    res.render("orders", {priceTillNow:totalMoney,listOfDishes:OrderList});
})

// ---------------------------------------------------------------------------------------------
 app.get("/payment",(req, res)=>{
     res.send("<h1>this is payments page</h1>");
 })
app.post("/payment",(req, res)=>{


    res.render("payment")

})
// ---------------------------------------------------------------------------------------------
// app.get("/status",(req, res)=>{
    
    
// })
app.post("/status",(req, res)=>{
    const paymentMethod = req.body.payment_option;
    var newPayment;
    if(paymentMethod=="cash"){
        newPayment = new Payment({
            cost: totalMoney,
            mode: paymentMethod,
            Status: false
        })
    }
    else{
         newPayment = new Payment({
            cost: totalMoney,
            mode: paymentMethod,
            Status: true
        })
    }


newPayment.save();

      newOrder= new Order({
       customer: newCustomer,
      orderedItems: OrderList,
      payment: newPayment
   })
   newOrder.save();
   while(OrderList.length > 0) {
    OrderList.pop();
}
   totalMoney=0;
   res.render("success",{orderID: newOrder._id});

})
// ---------------------------------------------------------------------------------------------
app.post('/orderAgain', (req,res)=>{
    res.redirect("/");
})


app.get("/adminLogin", (req,res)=>{
    res.render("adminlogin",{title:"entert your login ID and password: "});
})

app.post("/adminLogin",async(req, res)=>{
   try{const loginID= req.body.loginID;
   const password =  req. body.password;
   if(loginID==="system"&&password==="system") res.redirect("/adminMenu"); 

   const userID = await Admin.findOne({loginID:loginID});
 
   if(userID.password===password){
       res.redirect("/adminMenu"); 
   }
   
   else { res.render("adminlogin",{title:"wrong password or loginID!! try again "});}
} catch(error){
    res.render("adminlogin",{title:"wrong password or loginID!! try again "});
}

})


app.get("/adminMenu",(req, res)=>{
  res.render("adminMenu");
})
// ---------------------------------------------------------------------------------------------

app.get("/addAdmin",(req, res)=>{
    res.render("addAdmin");
})

app.post("/addAdmin",(req, res)=>{
    const userName = req.body.UserName;
    const password = req.body.password;
    const newAdmin = new Admin({
        loginID: userName,
        password: password
    })
    newAdmin.save();
    res.redirect("/adminMenu");
})

// ---------------------------------------------------------------------------------------------

app.get("/updateMenu", (req, res)=>{
    Item.find({},(err,foundDishes)=>{
        if(err){
            console.log(err);
        }
        else{
            res.render("updateMenu",{listOfDishes: foundDishes});
        }
    })
})

app.post("/updateMenu",(req, res)=>{
    const name= req.body.itemName;
    const newprice = req.body.itemPrice;
    const newItem = new Item({
        Dish: name,
        price: newprice
    });
    newItem.save();
    res.redirect("/updateMenu");
})
// ---------------------------------------------------------------------------------------------

app.post("/deleteItems",(req, res)=>{
    const reqId=req.body.checkbox;
    Item.findByIdAndDelete(reqId, function (err,item ) {
        if (err){
            console.log(err)
        }
        else{
           res.redirect("/updateMenu")
        }
    })
})
// ---------------------------------------------------------------------------------------------

app.get('/manageOrders', (req, res)=>{
    Order.find({},(err, foundOrders)=>{
        if(err){
            console.log(err);
        }
        else{
           res.render("manageOrders",{list: foundOrders});
        }
    })
})
// ---------------------------------------------------------------------------------------------
app.post("/changePaymentStatus",(req, res)=>{
    const id = req.body.ID;
 Order.findByIdAndUpdate(id,{$set: {"payment.Status":true}},(err, obj)=>{
     if(err){
         console.log(err);
     }   
 })
 res.redirect("/manageOrders")
})

// ---------------------------------------------------------------------------------------------
app.get("/deleteOrderfromList",(req, res)=>{
    Order.find({},(err, foundOrders)=>{
        if(err){
            console.log(err);
        }
        else{
           res.render("removeFromOrders",{list: foundOrders});
        }
    })
})
app.post("/deleteOrderfromList",(req, res)=>{
    const id = req.body.id;
    Order.findByIdAndDelete(id,(err)=>{
        if(err){
            console.log(err);
        }
    })
    res.redirect("/deleteOrderfromList");
})
// ---------------------------------------------------------------------------------------------
app.listen(3000, function() {
    console.log("Server started on port 3000");
  });

