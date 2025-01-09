const express = require('express');
const path = require('path');
const session = require('express-session');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const app = express();

// Configurações do banco de dados
const url_bancoDeDados = "postgresql://banco_de_dados_owner:4ojzxLphV1FW@ep-tight-moon-a5ips83x.us-east-2.aws.neon.tech/banco_de_dados?sslmode=require";

const conexao = new Pool({
    connectionString: url_bancoDeDados,
    ssl: {
        rejectUnauthorized: false
    }
});

app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: false,
    saveUninitialized: true
}));

// Middleware para analisar solicitações POST
app.use(bodyParser.urlencoded({ extended: false }));

// Defina o diretório de visualizações (views)
app.set('views', path.join(__dirname, '/paginas'));

// Defina o motor de visualização como EJS
app.set('view engine', 'ejs');

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, '/paginas')));

//Middleware para verificar se o usuário está logado
function verificarSessao(req, res, next) {
    if(!req.session.usuarios){
        return res.redirect('/login');
    }
    next();
}

// Rota para a página inicial
app.get('/', (req, res) => {
    res.render('index', { title: 'Lupin', extraStyles: null, extraHeaderContent: null ,usuario: req.session.usuarios});
});

// Rotas para outras páginas
app.get('/index', (req, res) => {
    res.render('index', { title: 'Lupin', extraStyles: null, extraHeaderContent: null,usuario: req.session.usuarios });
});

app.get('/temporada1', (req, res) => {
    res.render('temporada1', { title: 'Temporada 1', extraStyles: null, extraHeaderContent: null,usuario: req.session.usuarios });
});

app.get('/temporada2', (req, res) => {
    res.render('temporada2', { title: 'Temporada 2', extraStyles: null, extraHeaderContent: null,usuario: req.session.usuarios });
});

app.get('/temporada3', (req, res) => {
    res.render('temporada3', { title: 'Temporada 3', extraStyles: null, extraHeaderContent: null,usuario: req.session.usuarios });
});

app.get('/elenco', (req, res) => {
    res.render('elenco', { title: 'Elenco', extraStyles: null, extraHeaderContent: null,usuario: req.session.usuarios });
});

app.get('/endereco', (req, res) => {
    res.render('endereco', { 
        title: 'Endereco', 
        extraStyles: `
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0-beta1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-0evHe/X+R7YkIZDRvuzKMRqM+OrBnVFBL6DOitfPri4tjfHxaWutUpFmBp4vmVor" crossorigin="anonymous">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.3/font/bootstrap-icons.css">
        `,
        extraHeaderContent: null // ou qualquer conteúdo extra específico para o cabeçalho
        ,usuario: req.session.usuarios
    });
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Login', includeBootstrap: false, extraHeaderContent: null,usuario: req.session.usuarios });
});

app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        //console.log(req.body.email)
        //console.log(req.body.senha)
        const cx = await conexao.connect();
        const result = await cx.query('SELECT * FROM usuarios WHERE email = $1 AND senha = $2', [email, senha]);
        const usuarios = result.rows[0];

        if(usuarios){
            req.session.usuarios = { id: usuarios.id, nome: usuarios.nome, isAdmin: usuarios.isadmin };
            //console.log('Sessão configurada:', req.session.usuarios);
            res.redirect('/index');
        } else {
            res.send('Login falhou. Tente novamente!')
        }
        cx.release();
    } catch (e) {
        //console.log(e);
        res.send('Erro no servidor.');
    }
});

// Corrija a rota para cadastro_usuario
app.get('/cadastro_usuario', (req, res) => {
    res.render('cadastro_usuario', { title: 'Cadastrar Usuário', includeBootstrap: false, extraHeaderContent: null,usuario: req.session.usuarios });
});

app.post("/cadastro_usuario", async function(req, res){
    const {nome, email, senha, cep, isAdmin} = req.body;

    try{
        const cx = await conexao.connect();
        const insert = "Insert into usuarios (nome, email, senha, cep, isAdmin) values ($1, $2, $3, $4, $5)"
        await cx.query(insert, [nome, email, senha, cep, isAdmin]);
        cx.release();
        res.redirect('/login');
    }
    catch(e){
        console.log(e);
    }
    //res.redirect("/");
});

app.get("/listar_usuario", async function(req, res) {
    try {
        const cx = await conexao.connect();
        const usuarios = await cx.query("SELECT * FROM usuarios ORDER BY id");
        const usuariosResultado = usuarios.rows;
        const isAdmin = req.session.usuarios && req.session.usuarios.isAdmin; // Verifica se o usuário é administrador
        console.log('isAdmin na rota listar_usuario:', isAdmin);
        res.render("listar_usuario", { usuariosResultado, title: "Editar Usuário", isAdmin: isAdmin,usuario: req.session.usuarios });
    } catch (e) {
        console.log(e);
    }
});

app.get("/excluir_usuario/:id", async function(req, res){
    try{
      const {id} = req.params;
      //const pessoasDeletada = await conexao.query("Delete from usuarios where id = $1", [id]);
      await conexao.query("delete from usuarios where id = $1", [id]);
    } catch(e){
      console.log(e)
    }
    res.redirect("/listar_usuario")
});

app.get("/usuariosAPI", async function(req, res){
    const {id} = req.params;
    try{
      const cx = await conexao.connect();
      const usuariosResult = await conexao.query("Select * from usuarios");
      const usuarios = usuariosResult.rows;
      return res.json(usuarios);
    }
    catch(e){
      console.log(e);
    }
});

app.get("/editar_usuario/:id", async function(req, res){
    const { id } = req.params;
    try{
      const cx = await conexao.connect();
      const usuariosResult = await cx.query("Select * from usuarios where id = $1", [id]);
      const usuarios = usuariosResult.rows[0];
      cx.release();
      res.render(__dirname + "/paginas/editar_usuario.ejs", {usuarios, title: "Editar Usuário",usuario: req.session.usuarios})
    }
    catch(e){
      console.log(e.message);
      res.redirect("/listar_usuario");
    }
    
});
  
  
  app.post("/editar_usuario", async function(req, res){
    const{ id, nome, email, senha, cep } = req.body;
  
    try{
      const cx = await conexao.connect();
      const updateSQL = "Update usuarios set nome = $1, email = $2, senha = $3, cep = $4 where id = $5";
      await cx.query(updateSQL, [nome, email, senha, cep, id]);
      cx.release();
    }
    catch(e){
      console.log(e);
    }
    res.redirect("/listar_usuario")
});

app.get('/comentar', verificarSessao,(req, res) => {
    res.render('comentar', { title: 'Comentar', includeBootstrap: false, extraHeaderContent: null,usuario: req.session.usuarios });
});

app.post("/comentar", verificarSessao, async function(req, res){
    const {conteudo} = req.body;
    const usuarioId = req.session.usuarios.id; //Obtendo o ID do usuário da sessão
    try{
        const cx = await conexao.connect();
        const insert = "Insert into comentarios (conteudo, usuario_id) values ($1, $2)";
        await cx.query(insert, [conteudo, usuarioId]);
        cx.release();
    }
    catch(e){
        console.log(e);
    }
    res.redirect("/comentarios");
});


app.get("/comentarios", async function(req, res){
    try {
        const cx = await conexao.connect();
        const comentarios = await cx.query(
            `SELECT comentarios.id, comentarios.conteudo, usuarios.nome AS autor
             FROM comentarios
             JOIN usuarios ON comentarios.usuario_id = usuarios.id
             ORDER BY comentarios.id`
        );
        const comentariosResultado = comentarios.rows;
        const isAdmin = req.session.usuarios && req.session.usuarios.isAdmin; // Confirmação do perfil do usuário
        
        console.log("Valor de isAdmin:", isAdmin); // Adicionando log para verificar o valor de isAdmin
        
        res.render("comentarios", { comentariosResultado, title: "Comentários", isAdmin: isAdmin,usuario: req.session.usuarios });
    } catch (e) {
        console.log(e);
        res.send('Erro no servidor.');
    }
});

/*app.get("/comentarios", async function(req, res){
    try {
        const cx = await conexao.connect();
        const comentarios = await cx.query("SELECT * FROM comentarios ORDER BY id");
        const comentariosResultado = comentarios.rows;
        res.render("comentarios", { comentariosResultado, title: "Comentários" });
    } catch(e) {
        console.log(e);
    }
});*/

app.get("/editar_comentarios/:id", verificarSessao, async function(req, res){
    const { id } = req.params;

    try{
      const cx = await conexao.connect();
      const comentariosResult = await cx.query("Select * from comentarios where id = $1", [id]);
      const comentarios = comentariosResult.rows[0];
      cx.release();
      res.render(__dirname + "/paginas/editar_comentarios.ejs", {comentarios, title: "Editar comentário",usuario: req.session.usuarios})
    }
    catch(e){
      console.log(e.message);
      res.redirect("/comentarios");
    }
    
});
  
  
app.post("/editar_comentarios", async function(req, res){
    const{ id, conteudo } = req.body;
  
    try{
      const cx = await conexao.connect();
      //console.log(id)
      const updateSQL = "Update comentarios set conteudo = $1 where id = $2";
      //console.log(conteudo)
      await cx.query(updateSQL, [conteudo, id]);
      cx.release();
    }
    catch(e){
      console.log(e);
    }
    res.redirect("/comentarios")
});

app.get("/excluir_comentarios/:id", verificarSessao, async function(req, res){
    try{
      const {id} = req.params;
      //const comentariosDeletado = await conexao.query("Delete from comentarios where id = $1", [id]);
      await conexao.query("delete from comentarios where id = $1", [id]);
    } catch(e){
      console.log(e)
    }
    res.redirect("/comentarios")
});


app.get("/usuariosAPI/:id", async function(req, res){
    const {id} = req.params;
    try{
      const cx = await conexao.connect();
      const usuariosResult = await conexao.query("Select * from usuarios where id = $1", [req.params.id]);
      const usuarios = usuariosResult.rows;
      return res.json(usuarios);
    }
    catch(e){
      console.log(e);
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Inicia o servidor
const port = 3000;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

/*

// CREATE - Adicionar uma nota
app.post('/notas', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Você deve estar logado para dar uma nota' });
    }
    const { nota } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO notas (usuario_id, nota) VALUES ($1, $2) RETURNING *',
            [req.session.userId, nota]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao adicionar nota:', err);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});


// READ - Exibir todas as notas
app.get('/notas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM notas');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao obter notas:', err);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});


//UPDATE - Atualizar uma nota
app.put('/notas/:id', async (req, res) => {
    const { id } = req.params;
    const { nota } = req.body;
    try {
        const result = await pool.query(
            'UPDATE notas SET nota = $1 WHERE id = $2 RETURNING *',
            [nota, id]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar nota:', err);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});


//DELETE - Excluir uma nota
app.delete('/notas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM notas WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        console.error('Erro ao excluir nota:', err);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});
*/ 



