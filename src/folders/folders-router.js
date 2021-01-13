'use strict';
const path = require('path')
const express = require('express');
const xss = require('xss');
const FoldersService = require('./folders-service');

const foldersRouter = express.Router();
const jsonParser = express.json();
const serializeFolder = folder => ({ 
    ...folder,
    title: xss(folder.title) 
});

foldersRouter
  .route('/')
  .get((req, res, next) => {
    FoldersService.getAllFolders(
      req.app.get('db')
    )
      .then(folders => {
        res.json(folders.map(serializeFolder));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { title } = req.body;
    const newFolder = { title };
    for (const [key, value] of Object.entries(newFolder)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }

    FoldersService.insertFolder(
      req.app.get('db'),
      newFolder
    )
      .then(folder => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${folder.id}`))
          .json(serializeFolder(folder));
      })
      .catch(next);
  });

foldersRouter
  .route('/:folder_id')
  .all((req, res, next) => {
         FoldersService.getById(
           req.app.get('db'),
           req.params.folder_id
         )
           .then(folder => {
             if (!folder) {
               return res.status(404).json({
                 error: { message: `Folder doesn't exist` }
               })
             }
             res.folder = folder // save the folder for the next middleware
             next() // don't forget to call next so the next middleware happens!
           })
           .catch(next)
       })
  .get((req, res, next) => {
    res.json({
        id: res.folder.id,
        title: xss(res.folder.title), // sanitize title
        date_created: res.folder.date_created,
      });
  })
  .delete((req, res, next) => {
    const knexInstance = req.app.get('db');
    FoldersService.deleteFolder(knexInstance, req.params.folder_id)
      .then (()=>{
      res.status(204).end()
      })
      .catch(next)
  })
  .patch(jsonParser, (req,res, next) => {
      const {title} = req.body
      const folderToUpdate = { title }
      const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
   if (numberOfValues === 0) {
     return res.status(400).json({
       error: {
         message: `Request body must contain 'title'`
       }
     })
   }

      FoldersService.updateFolder(
          req.app.get('db'),
          req.params.folder_id,
               folderToUpdate
             )
               .then(numRowsAffected => {
                 res.status(204).end()
               })
               .catch(next)
  })


module.exports = foldersRouter;