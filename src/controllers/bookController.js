const { request } = require("express")
const bookModel = require("../model/bookModel")
const userModel = require('../model/userModel')
const mongoose = require("mongoose")

//----------------------------------------------Validation functions ------------------------------------------------------------------

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

//-------------------------------------------------------------------------------------------------------------------------------------------


const createBook = async function (req, res) {
    try {
        const requestBody = req.body;
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide blog details' })
            return
        }
        const { title, excerpt, userId, ISBN, category, subcategory, reviews, isDeleted, releasedAt } = requestBody;
        if (!isValid(title)) {
            res.status(400).send({ status: false, message: 'Book Title is required' })
            return
        }
        const isTitleUsed = await bookModel.findOne({ title });

        if (isTitleUsed) {
            res.status(400).send({ status: false, message: `${title}  already registered` })
            return
        }
        if (!isValid(excerpt)) {
            res.status(400).send({ status: false, message: 'Excerpt is required' })
            return
        }
        if (!isValid(userId)) {
            res.status(400).send({ status: false, message: 'UserId is required' })
            return
        }
        if (!isValid(ISBN)) {
            res.status(400).send({ status: false, message: `ISBN is not a valid` })
            return
        }
        const isISBNalreadyUsed = await bookModel.findOne({ ISBN });

        if (isISBNalreadyUsed) {
            res.status(400).send({ status: false, message: `${ISBN} should be unique` })
            return
        }
        if (!isValid(category)) {
            res.status(400).send({ status: false, message: 'Book category is required' })
            return
        }
        if (!isValid(subcategory)) {
            res.status(400).send({ status: false, message: 'Book subcategory is required' })
            return
        }
        //  if (!isValid(reviews)) {
        //  res.status(400).send({ status: false, message: ' Please provide a valid Review between 1-5' })
        // return
        // }
        // if (!isValid(releasedAt)) {
        //     res.status(400).send({ status: false, message: ' Please provide a valid ReleasedAt date' })
        //     return
        // }

        const user = await userModel.findById(userId);
        if (!user) {
            res.status(400).send({ status: false, message: `User does not exists` })
            return
        }

        const bookData = {
            title,
            excerpt,
            userId,
            ISBN,
            category,
            subcategory,
            reviews,
            releasedAt,
            isDeleted: isDeleted ? isDeleted : false,
            deletedAt: isDeleted ? new Date() : null
        }
        const newBook = await bookModel.create(bookData)
        res.status(201).send({ status: true, message: 'New book created successfully', data: newBook })

    } catch (error) {
        console.log(error)
        res.status(500).send({ status: false, message: error.message });
    }
}
module.exports.createBook = createBook



const getBook = async (req, res) => {

    try {

        let filter = new Object

        if (req.query.userId) {

            if (!(isValid(req.query.userId) && isValidObjectId(req.query.userId))) {
                return res.status(400).send({ status: false, msg: "userId is not valid" })
            }
            if (req.query.userId == req.decodeToken._id) {
                filter["userId"] = req.query.userId

            } else {
                res.status(400).send({ msg: "Authorization Denide ! u are not valid author..." })
                return
            }

        }

        if (req.query.category) {

            if (!isValid(req.query.category)) {
                return res.status(400).send({ status: false, message: 'Book category is not valid ' })

            }
            filter["category"] = req.query.category
        }


        if (req.query.subcategory) {

            if (!isValid(req.query.subcategory)) {
                return res.status(400).send({ status: false, message: 'Book subcategory is not valid' })

            }
            filter["subcategory"] = req.query.subcategory
        }

        if (!(Object.values(filter).length > 0)) {
            res.status(400).send({ status: false, message: 'no parameter is provided' })
            return
        }
        filter["isDeleted"] = false




        let book = await bookModel.find(filter).select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1 })

        if (book.length > 0) {
            res.status(200).send({ status: true, message: "book found", data: book })
            return
        } else {
            res.status(400).send({ status: false, message: "either book is deleted or u are not valid user to see this book" })
            return

        }

    } catch (err) {
        console.log(err)
        res.status(500).send({ msg: "i found the error", error: err.message })
    }



}

module.exports.getBook = getBook



const updateBook = async (req, res) => {

    try {

        let filter = {
            _id: req.params.bookId,
            isDeleted: false,
            userId: req.decodeToken._id
        }

        


        if (!isValidRequestBody(req.body)) {
            res.status(400).send({ status: false, message: 'body is empty' })
            return
        }

        let { title, excerpt, releasedAt, ISBN } = req.body

        if (title) {

            if (!isValid(title)) {
                return res.status(400).send({ status: false, message: 'title is not valid ' })

            }
           
        }

        if (excerpt) {

            if (!isValid(excerpt)) {
                return res.status(400).send({ status: false, message: 'excerpt is not valid ' })

            }
            
        }

        if (ISBN) {

            if (!isValid(ISBN)) {
                return res.status(400).send({ status: false, message: 'ISBN is not valid ' })

            }
            
        }

        if (releasedAt) {

            if (!isValid(releasedAt)) {
                return res.status(400).send({ status: false, message: 'releasedAt is not valid value ' })
            }

            if(!/((\d{4}[\/-])(\d{2}[\/-])(\d{2}))/.test(releasedAt)){
                return res.status(400).send({ status: false, message: ' \"YYYY-MM-DD\" this Date format & only number format is accepted ' })
            }
            
            
        }

        let updatedBook = await bookModel.findOneAndUpdate(filter, req.body,{new:true})

        if (updatedBook) {
            res.status(201).send({ status: true, message: "success", data: updatedBook })
            return
        } else {
            res.status(201).send({ status: false, message: "either book is deleted or u are not valid user to update this book" })
        }

    } catch (err) {
        console.log(err)
        res.status(500).send({ msg: "i found the error", error: err.message })
    }


}

module.exports.updateBook=updateBook




const deleteById=async (req,res)=>{

    try{

        let filter=new Object

        if (!(isValid(req.params.bookId) && isValidObjectId(req.params.bookId))) {
            return res.status(400).send({ status: false, msg: "bookId is not valid" })
        }
        filter["_id"]=req.params.bookId
        filter["isDeleted"]=false
        filter["userId"]=req.decodeToken._id
        console.log(filter)

        let deletedBook=await bookModel.findByIdAndUpdate(filter,{isDeleted:true,deletedAt:new Date()})
        console.log(deletedBook)

        if(deletedBook){
            return res.status(200).send({ status: true, msg: "book is successfully deleted" })
        }else{
            return res.status(400).send({ status: false, msg: "either the book is deleted or u are not valid authoe to delet this book" })

        }


    }catch(err){
        console.log(err)
        res.status(500).send({ msg: "i found the error", error: err.message })

    }


}

module.exports.deleteById=deleteById




