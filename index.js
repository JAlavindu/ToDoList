const express = require('express');
const app = express();
const Pool = require('pg').Pool;
const path = require('path');
const ejs = require('ejs');
const port =3000;
require('dotenv').config();

const pool = new Pool({
    user: process.env.USER_NAME,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
})

pool.connect((err, client, release) => {
    if(err) {
        return console.error('Error acquiring client', err.stack);
    }
    client.query('SELECT NOW()', (err, result) => {
        release();
        if(err) {
            return console.error('Error executing query', err.stack);
        }
        console.log(result.rows);
    });
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use('/static', express.static('public'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//read
app.get('/', async(req, res) => {
    const data = await pool.query('SELECT * FROM todo ORDER BY date');
    res.render('index', {data: data.rows});
});

//filter
app.post('/filter', async(req, res) => {
    const searchDate = req.body.date;
    const data = await pool.query('SELECT * FROM todo WHERE date = $1', [searchDate]);
    res.render('filter ', {data: data.rows});
});

//add todo endpoint
app.post('/addTodo', async(req, res) => {
    const {todo, date} = req.body;
    try{
        const result = await pool.query('INSERT INTO todo (todo, date) VALUES ($1, $2) RETURNING *', [todo, date]);
        console.log(result.rows[0]);
        res.redirect('/');
    }catch(err){
        console.error(err);
        res.status(500).json({error: 'Something went wrong'});
    }
});

//UPDATE 
    app.get('/edit/:id', async(req, res) => {
        const id = req.params.id;
        const data = await pool.query('SELECT * FROM todo WHERE id = $1', [id]);
        res.render('edit', {data: data.rows[0]});
    });

    app.post('/update/:id', async(req, res) => {
        const id = req.params.id;
        const {todo, date} = req.body;
        try{
            const result = await pool.query('UPDATE todo SET todo = $1, date = $2 WHERE id = $3 RETURNING *', [todo, date, id]);
            console.log(result.rows[0]);
            res.redirect('/');
        }catch(err){
            console.error(err);
            res.status(500).json({error: 'Something went wrong'});
        }
    });

//DELETE
app.get('/delete/:id', async(req, res) => {
    const id = req.params.id;
    try{
        const result = await pool.query('DELETE FROM todo WHERE id = $1', [id]);
        console.log(result.rows[0]);
        res.redirect('/');
    }catch(err){
        console.error(err);
        res.status(500).json({error: 'Something went wrong'});
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);

});