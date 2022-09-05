const mongo = require('mongodb').MongoClient;

const checkUser = (db, user, callback) => {
    const users = db.collection('user');
    users.findOne({ email: user.email }, (err, result) => {
        if (err) {
        console.log(err);
        return;
        }
        callback(result);
    });
};

const insertUser = (db, user, callback) => {
    const users = db.collection('user');
    users.insertOne(user, (err, result) => {
        if (err) {
        console.log(err);
        return;
        }
        callback(result);
    });
}

const updateUser = (db, user, callback) => {
    const users = db.collection('user');
    users.updateOne({ email: user.email }, { $set: { name: user.name } }, (err, result) => {
        if (err) {
        console.log(err);
        return;
        }
        callback(result);
    });
}

const deleteUser = (db, user, callback) => {
    const users = db.collection('user');
    users.deleteOne({ email: user.email }, (err, result) => {
        if (err) {
        console.log(err);
        return;
        }
        callback(result);
    });
}

const checkUserExist = (db, user, callback) => {
    checkUser(db, user, (result) => {
        if (result) {
        callback(true);
        } else {
        callback(false);
        }
    });
}

const isUserLoggedIn = (req, res, next,other=()=>{}) => {
    if (req.cookies.auth) {
        next();
    }else{
        other();
    }
}


const createRoom = (db, room, callback) => {
    const rooms = db.collection('room');
    rooms.insertOne(room, (err, result) => {
        if (err) {
        console.log(err);
        return;
        }
        callback();
    });
}

const checkRoomExist = (db, room, callback) => {
    const rooms = db.collection('room');
    rooms.findOne({ roomid: room.roomid }, (err, result) => {
        if (err) {
        console.log(err);
        return;
        }
        callback(result);
    });
}


const deleteRoom = (db, room, callback) => {
    const rooms = db.collection('room');
    rooms.deleteOne({ roomid: room.roomid, hostid: room.hostid }, (err, result) => {
        if (err) {
        console.log(err);
        return; 
        }
        callback(result);
    });
}

const updateRoom = (db, room, callback) => {
    const rooms = db.collection('room');
    rooms.updateOne({ roomid: room.roomid }, { $set: {hostid: room.hostid } }, (err, result) => {
        if (err) {
        console.log(err);
        return;
        }
        callback(result);
    });
}


module.exports = {
    checkUser,
    insertUser,
    updateUser,
    deleteUser,
    checkUserExist,
    isUserLoggedIn,
    createRoom,
    deleteRoom
};
