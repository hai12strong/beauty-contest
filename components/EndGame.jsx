"use client";
import  NavBar  from "@/components/NavBar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import HistogramChart from "./HistogramChart";

import { signOut } from "next-auth/react";

export default function EndGame() {

  const [userbid, setBid] = useState();
  const [error, setError] = useState("");
  const [game, setGame] = useState([{ winner: "",
  maxnumbid: 0,
  gamelength: 0,
  gametype: 'public',
  isactive:'ended'}]);
  const [gameData, setGameData] = useState([]);
  const { data: session } = useSession();
  const router = useRouter();


  const useremail = session?.user?.email;
  //The first part is to connect to the server to find out the active game.
  //Get the last game and check the game status
 
  
  //Collect the game and game data to start with
  useEffect( () => {
    async function getGame() {
      try {
        const res = await fetch('api/getGame', {
          method: "POST",
          headers: {
            "Content-type": "application/json"
          },
        });
        
        if (res.ok) {
          const resData = await res.json();
          setGame(resData)
        }    
        
      } catch (err) {
        console.error(err);
      }     
    
    }
    async function getGameData() {
      try {
        const res = await fetch('api/getGameData', {
          method: "POST",
          headers: {
            "Content-type": "application/json"
          },
        });
        
        if (res.ok) {
          const resData = await res.json();
          if (typeof resData !== 'undefined' && resData.length > 0 ) {
            setGameData(resData);
          }
          
        }    
      } catch (err) {
        console.error(err);
      }
    
    }
    getGameData();
    getGame();

    //async function getGameData() {
     // const res = await fetch('api/getGameData');
     // const resgameData = await res.json();
     // setGameData(resgameData);
   // }
   const interval = setInterval(async () => {
    await getGame();
    await getGameData();
  }, 5 * 1000);
    

  return () => clearInterval(interval)
    //getGameData();

  }, []);
  
  //console.log(gameData);
  //console.log(game[0].maxnumbid);
 
  //Get the status of the game
  const isactive = () => {
    if (typeof game !== 'undefined' && game.length > 0 ) {
      return game[game.length - 1].isactive;
    } else {
      return 'ended';
    }
  }
  //console.log(isactive());
  //Get the max number of bid
  const maxnumbid = () => {
    if (typeof game !== 'undefined' && game.length > 0 ) {
      return game[game.length - 1].maxnumbid;
    } else {
      return 0;
    }
  }

  //Calculate the winner 
  const calculateWinner = (_gameData) => {
    if (_gameData.length > 0) {
      if(_gameData[0].bid.length > 0){        
      var simplifiedGameData = _gameData.map(item => {
        return {"email": item.email, 
        "lastbid":  parseFloat(item.bid[item.bid.length - 1]['$numberDecimal'].toString()),
      }; });
      var _bidList = simplifiedGameData.map(item=>item.lastbid);
      var _averageBid = _bidList.reduce((a,c) => a + c, 0)/_bidList.length;
      //find closest indexes
      const diffArr = _bidList.map(x => Math.abs(_averageBid*0.75 - x));
      const minNumber = Math.min(...diffArr);
      const index = diffArr.map( (x,index) => { if(x === minNumber) return index}).filter(item => item !== undefined);
      const _winnerList = simplifiedGameData.filter((el,i) => index.some(j => i === j));
      const _winnerEmail = _winnerList.map(item => item.email);
      const _winnerBids = _winnerList.map(item => item.lastbid);
      return {
        userwinner: _winnerEmail, 
        winningbid: _winnerBids,
        averagebid:_averageBid,
        bidlist: _bidList,

      }

      } else {
        return {
          userwinner: [], 
          winningbid: [],
          averagebid: 0,
          bidlist:[],
        }

      }

    } else {
      return {
        userwinner: [], 
        winningbid: [],
        averangebid: 0,
        bidlist:[],
      }
    }

  }
  const {userwinner, winningbid, averagebid, bidlist} = calculateWinner(gameData);
  console.log(userwinner);
  //Get the winner 
  const getWinner = () => {
    if (typeof game !== 'undefined' && game.length > 0 ) {
      return game.map(item =><span key={item.winner}>{item.winner}, </span>);
    } else {
      return <></>;
    }
  }
  //Get the game data of the current player
  const userGameData = () => {
    if (typeof gameData !== 'undefined' && gameData.length > 0 ) {
     const data = gameData.filter((item)=>item.email===useremail);
    if (typeof data!== 'undefined'&&data.length > 0) {
      return data[0];
    } else {
      return {
        email: useremail,
        bid: [],
      } ;
    }
    } else {
      return {
        email: useremail,
        bid: [],
      } ;
    }
  }
  //console.log(userGameData());
  //Render the public information 
  const renderPublicInfo = (_gameData) => {
    if (typeof(_gameData) !== 'undefined'&&_gameData.length > 0) {
      if(_gameData[0].bid.length > 0) {
        return ( <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="table-auto border-collapse border border-slate-400 w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead className=" text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>                
              <th className="border border-slate-300 px-6 py-3">Student ID</th>
              <th className="border border-slate-300 px-6 py-3">5 Latest Bids</th> 
              <th className="border border-slate-300 px-6 py-3">Latest Bid</th>      
              <th className="border border-slate-300 px-6 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {_gameData.map(item=> {
              return (
                <tr  key={item}>                   
                  <td className="border border-slate-300 px-6 py-3">{ item.email.slice(0,7) }</td>
                  <th className="border border-slate-300 px-6 py-3">{item.bid.length === 1? <span></span>: item.bid.slice(Math.max(item.bid.length-6,0), -1).map((usernumber)=>{
                        return (
                          <span className="line-through lowercase font-light">{usernumber['$numberDecimal'].toLocaleString()}, </span>
                          
                        )
                      }) 
                    
                  }</th> 
                  <td className="border border-slate-300 px-6 py-3">{ item.bid[item.bid.length - 1]['$numberDecimal'].toLocaleString()}</td>          
                  <td className="border border-slate-300 px-6 py-3">{ item.updated.slice(11,23) }</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
        
      )

      }
       
    }
  }
  //Handle the submission button
  const handleSubmit = async () => {
      try {
      const res = await fetch('api/endGame', {
        method: "POST",
        headers: {
          "Content-type": "application/json"
        },
        body: JSON.stringify({userwinner})
    });   
    if (res.ok) {
       
        setError("");
        
        //router.push("/");
    } else {
        console.log("Submission failed")
    }
      
    } catch (error) {
      console.log("Error when submission:", error) 
    }
   
  };
  //Render the form and public info

  const renderForm = () => {
    const userNumBid = (typeof userGameData().bid === 'undefined')? 0: userGameData().bid.length;
    return (
      isactive() === 'active'? <div className="grid place-items-center h-screen">
       
      <div >                   
          <button onClick={handleSubmit} className="bg-green-600 text-white font-bold cursor-pointer px-2 py-2">
            End the game
          </button>
          {error && (
            <div className="bg-red-500 text-white w-fit text-sm py-1 px-3 rounded-md mt-2">
              {error}
            </div>
          )}     
      </div>
     
    </div> : <div className="grid place-items-center p-20">The game's winner is {getWinner()}</div>
    );
  }

  return (
    <div> 
         <NavBar />
         <div className="grid place-items-center p-10">
          <h1 className="font-semibold text-xl"> Welcome {useremail} to game management portal !</h1>
          <HistogramChart props={bidlist}/>    
          {renderForm()}
          {renderPublicInfo(gameData)}     
        </div>
           
      
      
    </div>
    
  );
}