var express = require("express");
var app = express();

var database = require("mysql-simple");


//database.init('root', '', '', '2802db', 3306);
//console.log(database)
//database.init('ppp', 'pppppp', 'ppp', 'ame15', 3306);

function execute_query(sql_statement, response) {
  //console.log("Executing Query Statement... ");
  //console.log(sql_statement);

  database.query(sql_statement , [],
    function(errors, results)
  {
    if (errors) {
      //console.log('Error Executing Query Statement: ' + errors);
    }
   
    response({
        errors : errors,
        results : results,
        sql_statement : sql_statement
    });

    //console.log('Done Executing Query Statement');
  });
}

function execute_nonquery(sql_statement, response) {
  //console.log("Executing Non-Query Statement... ");
  //console.log(sql_statement);

  database.nonQuery(sql_statement, [],
    function(errors, results)
  {
    if (errors) {
      //console.log('Error Executing Non-Query Statement: ' + errors);
    }

    response({
        errors : errors,
        results : results,
        sql_statement : sql_statement
    });

    //console.log('Done Executing Non-Query Statement');
  });
}

app.use(express.urlencoded());
app.use(express.json());
app.use(function(req, res, next) {
    if (req.headers.origin) {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization')
        res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE')
        if (req.method === 'OPTIONS') return res.send(200)
    }
    next()
});

app.post("/init/", function (req, res) {
  db = req.body.db_connection;
	console.log("Connecting to database ...");
  database.init(db.user, db.password, db.name, db.host, db.port);

	var connection = { status : 0 };
	execute_nonquery("SHOW TABLES",  function(response) {
		if (!response.errors) {
			connection.status = 1;
		}
		res.json(connection);
	});
});

app.get("/show/databases/", function (req, res) {
  var sql_statement = "SHOW DATABASES";

  execute_nonquery(sql_statement, function(response) {
    res.json(response);
  });
});

app.get("/show/tables/:database/", function (req, res) {
  var database = req.params.database;
  var sql_statement = "SELECT table_name AS tableName FROM INFORMATION_SCHEMA.TABLES WHERE table_schema = '" + database + "'";

  execute_nonquery(sql_statement, function(response) {
    res.json(response);
  });
});

app.get("/describe/:table/", function (req, res) {
  var table = req.params.table;
  var sql_statement = "DESC " + table;

  execute_nonquery(sql_statement, function(response) {
    res.json(response);
  });
});

app.post("/select/:table/", function (req, res) {
  var filter = req.body.filter;
  var table = req.params.table;

  var sql_statement = "SELECT * FROM " + table;

  if (filter && filter.where)
    sql_statement += " WHERE " + filter.where;

  if (filter && filter.order_by)
    sql_statement += " ORDER BY " + filter.order_by;

  limit = 1000
  if (filter && filter.limit)
    limit = filter.limit;

  sql_statement += " LIMIT " + limit;

  execute_nonquery(sql_statement, function(response) {
    res.json(response);
  });
});

app.post("/insert/:table/", function (req, res) {
  var data = req.body.data;
  var table = req.params.table;

  var sql_statement = "INSERT INTO " + table;

  var value_list = [];
  var column_list = [];
  for (var key in data.values) {
    if (! /^(id|index)$/.test(key)) {
			value_list.push("\"" + data.values[key] + "\"");
			column_list.push(key);
		}
  }

  sql_statement += "(" + column_list.join(", ") + ")";
  sql_statement += " VALUES(" + value_list.join(", ") + ")";

  console.log(sql_statement);
  execute_nonquery(sql_statement, function(response) {
    res.json(response);
  });
});

app.post("/update/:table/", function (req, res) {
  var data = req.body.data;
  var table = req.params.table;

  var sql_statement = "UPDATE " + table + " SET ";

  var value_list = [];
  for (var key in data.values) {
    if (! /^(id|index)$/.test(key))
      value_list.push(key + "=\"" + data.values[key] + "\"");
  }

  sql_statement += value_list.join(", ");
  sql_statement += " WHERE id = " + data.values.id;

  execute_nonquery(sql_statement, function(response) {
    res.json(response);
  });
});

app.post("/delete/:table/", function (req, res) {
  var data = req.body.data;
  var table = req.params.table;
  var sql_statement = "DELETE FROM " + table + " WHERE id = " + data.values.id;

  console.log(sql_statement);
  execute_nonquery(sql_statement, function(response) {
    res.json(response);
  });
});


app.post("/upload/", function (req, res) {
  var data = req.body.data;
	
  if (data.sql_statement) {
    execute_nonquery(data.sql_statement, function(response) {
      console.log(response);
      res.json(response);
    });
  }
});


app.listen(8111);
console.log("Express is listening on port 8111");
