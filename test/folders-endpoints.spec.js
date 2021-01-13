
'use strict';

const  {expect}  = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const { makeFoldersArray } = require('./folders.fixtures');



describe('Folders Endpoints', function() {
  let db;
  
  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });
  
  after('disconnect from db', () => db.destroy());
  
  before('clean the table', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'));

  afterEach('cleanup',() => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'));
  describe('POST /api/folders', () => {
    it('responds with 400 and an error message when the \'title\' is missing', () => {
      return supertest(app)
        .post('/api/folders')
        .send({})
        .expect(400, {
          error: { message: 'Missing \'title\' in request body' }
        });
    });
    it('creates an folder, responding with 201 and the new folder',  function() {
      this.retries(3);
      const newFolder = {
        title: 'Test new folder',
      };
      return supertest(app)
        .post('/api/folders')
        .send(newFolder)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newFolder.title);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`);
        //   const expected = new Intl.DateTimeFormat('en-US').format(new Date())
        //   const actual = new Intl.DateTimeFormat('en-US').format(new Date(res.body.date_created))
        //   expect(actual).to.eql(expected)
        });
    });
  });
  describe('GET /api/folders', () => {
    context('Given no folders', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/folders')
          .expect(200, []);
      });
    });
    context('Given there are folders in the database', () => {
      const testFolders = makeFoldersArray();

      beforeEach('insert folders', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders);
      });

      it('responds with 200 and all of the Folders', () => {
        // eslint-disable-next-line no-undef
        return supertest(app)
          .get('/api/folders')
          .expect(200, testFolders);
      });
    });
  });

  describe('GET /api/folders/:folder_id', () => {
    context('Given no folders', () => {
      it('responds with 404', () => {
        const folderId = 123456;
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(404, { error: { message: 'Folder doesn\'t exist' } });
      });
    });
        
    context('Given there are folders in the database', () => {
      const testFolders = makeFoldersArray();

      beforeEach('insert folders', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders);
      });

      it('responds with 200 and the specified folder', () => {
        const folderId = 2;
        const expectedFolder = testFolders[folderId - 1];
        // eslint-disable-next-line no-undef
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(200, expectedFolder);
      });
    });
  });
  describe('DELETE /api/folders/:folders_id', () => {

    context('Given no articles', () => {
      it('responds with 404', () => {
        const folderId = 123456;
        return supertest(app)
          .delete(`/api/folders/${folderId}`)
          .expect(404, { error: { message: 'Folder doesn\'t exist' } });
      });
    });
    context('Given there are folders in the database', () => {
      const testFolders = makeFoldersArray();
    
      beforeEach('insert folders', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders);
      });
    
      it('responds with 204 and removes the Folder', () => {
        const idToRemove = 2;
        const expectedFolders = testFolders.filter(folder => folder.id !== idToRemove);
        return supertest(app)
          .delete(`/api/folders/${idToRemove}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get('/api/folders')
              .expect(expectedFolders)
          );
      });
    });
  });
  describe('PATCH /api/folders/:folders_id', () => {
    context('Given no folders', () => {
      it('responds with 404', () => {
        const folderId = 123456;
        return supertest(app)
          .patch(`/api/folders/${folderId}`)
          .expect(404, { error: { message: 'Folder doesn\'t exist' } });
      });

    });

    context('Given there are folders in the database', () => {
      const testFolders = makeFoldersArray();
        
      beforeEach('insert folders', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders);
      });
        
      it('responds with 204 and updates the folder', () => {
        const idToUpdate = 2;
        const updateFolder = {
          title: 'updated folder title'
        };
        const expectedFolder = {
                 ...testFolders[idToUpdate - 1],
                 ...updateFolder
               }
        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send(updateFolder)
          .expect(204)
          .then(res => {
              supertest(app)
              .get(`/api/folders/${idToUpdate}`)
              .expect(expectedFolder)
          })
      });
      it(`responds with 400 when no required fields supplied`, () => {
             const idToUpdate = 2
             return supertest(app)
               .patch(`/api/folders/${idToUpdate}`)
               .send({ irrelevantField: 'foo' })
               .expect(400, {
                 error: {
                   message: `Request body must contain 'title'`
                 }
               })
            })
            it(`responds with 204 when updating only a subset of fields`, () => {
                      const idToUpdate = 2
                      const updateFolder = {
                        title: 'updated article title',
                      }
                      const expectedFolder = {
                        ...testFolders[idToUpdate - 1],
                        ...updateFolder
                      }
                
                      return supertest(app)
                        .patch(`/api/folders/${idToUpdate}`)
                        .send({
                          ...updateFolder,
                          fieldToIgnore: 'should not be in GET response'
                        })
                        .expect(204)
                        .then(res =>
                          supertest(app)
                            .get(`/api/folders/${idToUpdate}`)
                            .expect(expectedFolder)
                        )
                    })
                  

    });
  });
});