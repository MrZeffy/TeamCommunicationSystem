const mySQLConnector = require('mysql');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Database connectivity.
let connector = null;


const establishConnection = async (sqlOptions)=>{
    connector = mySQLConnector.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Daman6232'
    });

    // Establishing a connection with sql server.
    connector.connect((err) => {
        if (err) throw new Error(err);
        Promise.resolve();
    })
}


// Used for queries that don't need to return anything
let writeDataToDB = async function (query) {
    return new Promise((resolve, reject) => {
        connector.query(query, (err, res) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
};


const setupSchema = async () => {
    // Database/Table creation

    try{
        await writeDataToDB("CREATE DATABASE IF NOT EXISTS videoCallRooms;");
        await writeDataToDB(`USE videoCallRooms;`);
        await writeDataToDB(`CREATE TABLE IF NOT EXISTS room_records(
            room_no VARCHAR(50) PRIMARY KEY,
             users INT DEFAULT 0
             );`);
        await writeDataToDB(`CREATE TABLE IF NOT EXISTS user_credentials (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(30) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL
        );`)
        return;
    }catch(err){
        throw new Error(err);
    }
    
}


const addRoom =async (roomCode)=>{
    // Inserting room code to room_records table.
    try{
        await writeDataToDB(`INSERT INTO room_records(room_no) VALUES ("${roomCode}");`);
        return;
    }catch(err){
        throw new Error(err);
    }    
    
}


// Checks if room code is present in DB
const checkRoomInDB = function (roomCode) {
    return new Promise((resolve, reject) => {

        
        connector.query(`SELECT room_no FROM room_records WHERE room_no = "${roomCode}"`, (err, res) => {
            if (err) throw err;
            if (!res[0]) {
                return reject(err);
            }
            resolve(res[0]);
        });
    });
};


// Executes a query and wraps it inside a Promise.
const getDataFromDB = async function (query) {
    return new Promise((resolve, reject) => {
        connector.query(query, (err, res) => {
            if (err) throw err;
            if (!res[0]) {
                return reject('No data');
            }
            resolve(res);
        });
    });
};





const updateUserCount = function (roomCode, increment) {
    let query = `UPDATE room_records SET users = users ${increment ? "+" : "-"} 1 WHERE room_no = '${roomCode}'`;
    writeDataToDB(query);
};


async function getUserId(username) {
    try{
        let result = await getDataFromDB(`SELECT * FROM user_credentials WHERE username = "${username}"`);
        if (result[0]) {
            return result[0];
        } else {
            return null;
        }
    }catch(err){
        return null;
    }
}

async function loginUser(username, password){
    try{
        let user = await getUserId(username);        
        if(user === null){
            throw new Error('user does not exists');
        }
        let hashedPassword = user.password;
        await bcrypt.compare(password, hashedPassword);
        return {
            user_id: user.user_id,
            username: user.username
        }

    }catch(err){
        throw new Error(err);
    }
}



async function addUser(username, password) {
    // Checking if a user already exists.
    let userId = await getUserId(username).user_id;

    // If user already exists, return userId.
    if (userId !== null) {
        return userId;
    }
    try {
        // If not already exist, create a user.
        let hashedPassword = bcrypt.hashSync(password, saltRounds);
        await writeDataToDB(`INSERT INTO user_credentials (username, password)
         VALUES ("${username}", "${hashedPassword}");`);

        return await getUserId(username);
    } catch (err) {
        throw new Error(err);
    }

}


module.exports = {
    updateUserCount, 
    writeDataToDB,
    getDataFromDB,
    checkRoomInDB,
    addRoom,
    setupSchema,
    establishConnection,
    addUser,
    loginUser
}

