// require('dotenv').config();
import dotenv from "dotenv";
import connectDB from './db/index.js';
import {app} from "./app.js";

dotenv.config(
    {path: "./env"}
);

connectDB()
.then(() => {
   app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MongoDB connection error:", err.message);
    throw err;
});











// 2nd way to connect to MongoDB using async/await
/*
    import mongoose from 'mongoose';
    import {DB_NAME} from './constants.js';
   import express from "express";
   const app = exxpress();
   ( async() => {
        try{
        await mognoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on('error', (err) => {
            console.log(err);
            throw err;
        }

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });

        catch(err){
            console.log(err);
            throw err;
        } ) ()
 */