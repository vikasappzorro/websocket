const app = require('express')();
const http = require('http').Server(app);
const stickySession = require('sticky-session');
const redisAdapter = require('socket.io-redis');
const io = require('socket.io')(http,{'pingTimeout': 7000, 'pingInterval': 3000});
const cors = require('cors');
const morgan = require('morgan');
const redis = require('redis');
process.env.PORT =8080;
process.env.HOST = "162.144.71.183";
app.use(morgan('dev'));
app.use(cors());
const client = redis.createClient();
client.on('connect', (req, res) => {
  console.log("Redis Database  is connected....");
})

/* redis database coding to save user id and socket id */
function redisData(id, socket) {
  client.hmset(id, ["socket", socket], (err, response) => {
    if (err) {
      console.log(err);
      return false;
    } else {
      console.log(response);
      return true;
    }
  });

}
// io.use(stickySession);
// io.set('transports', ['websocket']);
/* socket coding part   */
io.on('connection',(socket) => {
  socket.on('onlineDriver', (data) => {
  	  	let driverSocketId = data;
  	  	// process.env.loginDriverSocketId = data; 
  	  	process.env.driverSocketId = data;  //socket id of driver 
	    let driverSocket = socket.id;
	    process.env.driverSocket = socket.id;
	    console.log("Driver socket id =======>",process.env.driverSocket,driverSocketId);
	    console.log("Generated socket id of driver=========>", driverSocket);	
	    redisData(driverSocketId,driverSocket);
  })


  /* Code to  available drivers */
  socket.on('availableDriver', (data) => {
		    //socket id of user  change userid into customerSockettId
		    console.log("Getting data from frontend driver data ###########################",data);
		    process.env.customerSocketId = data.customerSocketId;
		    process.env.customerID = data.customerID;
		    process.env.customerSocket = socket.id;
		    console.log("customer ===>", process.env.customerSocket);
		    let customerSocket = socket.id;
            redisData(data.customerSocketId,customerSocket);
		    console.log("--------------------------LOGIN CUSTOMER----------------------------------------")
		    console.log("Customer socket id ------>",   process.env.customerSocketId);	
		    console.log("Generated socekt id of login customer ----->", process.env.customerSocket);	    
		    console.log("Getting data from customer end ---->", data);
		    console.log("---------------------------------------------------------------------------------")
		    client.hgetall(data.driverSocketId, (err, result) => {
		      if (!result) {
		        console.log("9999999999999999999999No socket found to this user id", err);
		        console.log("77777777777777777", process.env.customerSocketId);
		        	io.volatile.to(process.env.customerSocket).emit('RideRejected',{
	 		                                                driverSocketId: data.driverSocketId,
	 		                                                driverConsent: data.driverConsent, 
	 		                                                driver_index: data.driver_index  
	 	             });
		      } else {
		        console.log("Socket id of driver getting from redis database emitted to driverSocket  //////",result);
		        //Emit driver end
		        process.env.driverSocketId = data.driverSocketId;
		        io.volatile.to(result.socket).emit("requestDriver", {
							          driverSocketId: data.driverSocketId,
							          cutomerID: process.env.customerID,
							          driver_index: data.driver_index,
							          CustomerName: data.CustomerName,
							          customerSocketId: data.customerSocketId,
							          Destination: data.Destination,
							          Source: data.Source,
							          CustomerImg: data.CustomerImg,
							          ride_price: data.ride_price,
							          ride_request_id: data.ride_request_id,
							          message: data.message,
							          noti_type: data.noti_type,
							          poolType: data.poolType,
							          distance: data.distance


		                   });

             	      }

		     })

		    
	

  });
//Driver end
  socket.on('confirmDriver', (data) => {
  	console.log(",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,")
    console.log("Driver confirmation for ride ================>", data);
    console.log(",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,")
      if (data.driverConsent == 'accept') {
      	process.env.driverConsent = data.driverConsent;
        client.hgetall(process.env.customerSocketId, (err, result)=>{
               if (!result) {
                 console.log("No socket found to this user id",err,process.env.customerSocketId);
               } else {
                 console.log("Socket id of customer getting from redis database", result);
                   // Emit to customer end
                   process.env.driverSocket = result.socket;
                   io.volatile.to(result.socket).emit("confirmRide", {socket_driver_id: data.socket_driver_id,
                   	                       cutomerID:process.env.customerID, 
                   	                       driverSocketId: data.driverSocketId,
                   	                       customerSocketId: data.customerSocketId,
                   	                       ride_request_id:data.ride_request_id,
                   	                       lattitude: data.lattitude,
                   	                       longitude: data.longitude,
                   	                       message:data.message,
                   	                       noti_type:data.noti_type,
                   	                       poolType: data.poolType,
                   	                       distance: data.distance

                   	       });

                     }

               })


    }

if(process.env.driverConsent == 'accept'){
	//Tracking driver by customer end
socket.on('private_message',(msg)=>{
		console.log("===================Tracking========================================", msg);
		// console.log(".................................TRACKING STARTED..........................")
		// console.log('Tracking started between customer  and driver ');
		// console.log("socket id of customer id  ====>",process.env.customerSocketId);
  //       console.log("socket id of driver id ===>", msg.driverSocketId);
		console.log("..................................TRACKING STARTED..................................")
        //Emit message to customer
        console.log("Data ==>===>======> emitted to connect socket id ",process.env.customerSocket);
        console.log("Ride status of driver", msg.ride_state);
        if(msg.ride_state == 'ride_not_completed'){
        	// console.log("Data emitted to connect socket id ride_not_completed ",process.env.customerSocket);
         //        io.volatile.to(process.env.customerSocket).emit('add_message',msg);
        client.hgetall(msg.customerSocketId,(err, result)=>{
        	if(!result){
        		console.log("No socket found to this user id[[[[[[[[[[[[[[[[[[[[[[[");
        	}else{
        		// process.env.driverSocketChat = result.socket;
                console.log("Emitted to this customerid ride_not_completed",msg.customerSocketId, result);
        		 io.volatile.to(result.socket).emit('add_message',msg);

        	}
        })

       }
        if(msg.noti_type == 'trip_completed'){
        	 // io.volatile.to(process.env.customerSocket).emit('add_message',msg);
        	 // console.log("trip_completed to customer socket id ====>", process.env.customerSocketId);
        	 // console.log("trip_completed  to customer socket ====>", process.env.customerSocket);
        client.hgetall(msg.customerSocketId,(err, result)=>{
        	if(!result){
        		console.log("No socket found to this user id[[[[[[[[[[[[[[[[[[[[[[[");
        	}else{
        		// process.env.driverSocketChat = result.socket;
        		console.log("Emitted to this customerid trip_completed",msg.customerSocketId, result);
        		 io.volatile.to(result.socket).emit('add_message',msg);

        	}
        })
        	 

        }
          if(msg.noti_type == 'cash_payment'){
        	 // io.volatile.to(process.env.customerSocket).emit('add_message',msg);
        	 // console.log("base fare emitted to this user socket", process.env.customerSocket);
        	 // console.log("base fare emitted to this user socket", process.env.customerSocketId);
        client.hgetall(msg.customerSocketId,(err, result)=>{
        	if(!result){
        		console.log("No socket found to this user id[[[[[[[[[[[[[[[[[[[[[[[");
        	}else{
        		// process.env.driverSocketChat = result.socket;
        		console.log("Emitted to this customerid trip_completed cash_payment",msg.customerSocketId, result);
        		 io.volatile.to(result.socket).emit('add_message',msg);

        	}
         })

        }


	 })   


// socket.on('customerMessage',(message)=>{
// 		console.log("Message getting from customer end", message);
// 	client.hgetall(message.driverSocketId,(err, result) =>{
// 		if(!result){
// 			console.log("No socket found to this user =====");
// 		}else{
// 			console.log("Message getting from customer end", message);
// 			// io.volatile.to(result.socket).emit('driverAddMessage',message);
// 		}
// 	})

// })

socket.on('driverMessage',(message)=>{
	console.log("Message getting from driver end ",message);
	client.hgetall(message.customerSocketId, (err,result)=>{
		if(!result){
			console.log("No socket found to this user =====;;;;");
		}else{
			console.log("Message getting from driver end ",message);
			io.volatile.to(result.socket).emit('customerAddMessage',message);
		}
	})
})

	 // socket.on('customerMessage',(message)=>{
  //         //Chatting between driver and customer.
  //        client.hgetall(message.customerSocketId,(err, result)=>{
  //       	if(!result){
  //       		console.log("No socket found to this user id[[[[[[[[[[[[[[[[[[[[[[[");
  //       	}else{
  //       		// process.env.driverSocketChat = result.socket;
  //       		process.env.chatCustomer = result.socket;
  //       		 // io.volatile.to(result).emit('add_message',msg);
  //       	}
  //       })
  //      client.hgetall(message.driverSocketId,(err, result)=>{
  //       	if(!result){
  //       		console.log("No socket found to this user id[[[[[[[[[[[[[[[[[[[[[[[");
  //       	}else{
  //       		// process.env.driverSocketChat = result.socket;
  //       		 // io.volatile.to(result).emit('add_message',msg);
  //       		 process.env.chatDriver = result.socket;

  //       	}
  //       })
  //         console.log("message ====>",message);
  //         // console.log("cutomer ==>", process.env.customerSocket);
  //          io.volatile.to(process.env.chatDriver).emit('driverShowMessage',message);
  //         // console.log("driver socket ===>", process.env.driverSocketChat)
  //          io.volatile.to(process.env.chatCustomer).emit('showMessage',message);         
              
	 // });  

  }

     
 if (data.driverConsent == 'reject') {
 	   console.log("Testing data inside driver reject //////////====>", data);
 	   	client.hgetall(data.customerSocketId, (err,result)=>{
		if(!result){
			console.log("No socket found to this user =====;;;;");
		}else{
			// io.volatile.to(result.socket).emit('customerAddMessage',message);
			 	io.volatile.to(result.socket).emit('RideRejected',{
	 		                                                driverSocketId: data.driverSocketId,
	 		                                                driverConsent: data.driverConsent, 
	 		                                                driver_index: data.driver_index ,
	 		                                                customerSocketId : data.customerSocketId 
	 	});
		
	   }
	})
	

 	 console.log("--------------------------------DRIVER REJECTED RIDE-------------------------------");
     
     }

 })


socket.on('confirmCustomer', (data)=>{
	console.log("````````````````````````````````````````CUSTOMER CANCEL REIDE``````````````````````")
  	console.log("Ride cancel by customer side ====>", data);
  	console.log("````````````````````````````````````````CUSTOMER CANCEL REIDE``````````````````````")
  		   client.hgetall(data.driverSocketId, (err, result)=>{
               if (!result) {
                 console.log("No socket found to this user id",err,data.driverSocketId);
               } else {
                 console.log("Socket get from redis accepted cak====>", result);
                // Emit to driver end
                   io.volatile.to(result.socket).emit("finalConfirmation", {
                   	                       message: data.message,
                   	                       noti_type:data.noti_type,
                   	                       customerConsent:data.customerConsent,
                   	                       ride_request_id:data.ride_request_id,
                   	                       driverSocketId: data.driverSocketId,
                   	                       customerSocketId: data.customerSocketId
                   	                       
                   	                       

                   	       });

                     }

               })


         
  })
//socket disconnected when driver and customer log out or sign out 
  socket.on('socketDisconnect',(socketid)=>{
  	   console.log("Data after disconnection ====>", socketid);
  	       client.del(socketid, (err, result)=>{
                 if (!result) {
                     console.log("No socket found to this user id",err,socketid);
                     return false;
                 } else {
                 	 console.log("Data after disconnection nerihthrwit m gnrgnrw gjrig gnerigrg girn ====>", socketid);
                    return true;
               }

           })


   })

	socket.on('connect_failed', () =>{
	  console.log("Sorry, there seems to be an issue with the connection!");
		 
    })

	//     socket.on('pong', (data)=>{
	//         console.log("Pong received from client");
	//     });
	//     setTimeout(sendHeartbeat, 25000);

	//     function sendHeartbeat(){
	//         setTimeout(sendHeartbeat, 25000);
	//         io.sockets.emit('ping', { beat : 1 });
	//     }

  });

function serverConnection(){
	var server = http.listen(process.env.PORT,process.env.HOST,() => {
    var host = server.address().address
    var port = server.address().port
    console.log("App listening at http://%s:%s", host, port)
  });

}

io.adapter(redisAdapter(serverConnection()));	


