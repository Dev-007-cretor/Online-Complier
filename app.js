const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const { exec, spawn } = require("child_process");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({ extended: false }));

const PORT = 3000;

const home = require('./routes/home');
const user = require('./routes/user');
const javaRoute = require('./routes/Java');
const pythonRoute = require('./routes/python');
const jsRoute = require('./routes/javascript');

app.use('/', home);
app.use('/', user);
app.use('/', javaRoute);
app.use('/', pythonRoute);
app.use('/', jsRoute);

const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

app.post("/run", (req, res) => {
  const code = req.body.code;
  const input = req.body.input || "";
  const uid = crypto.randomUUID();
  const cppFile = path.join(tempDir, `temp_${uid}.cpp`);
  const exeFile = path.join(tempDir, `temp_${uid}.exe`);

  fs.writeFile(cppFile, code, (err) => {
    if (err) return res.send("Error writing C++ file.");

    exec(`g++ "${cppFile}" -o "${exeFile}"`, (compileErr, _, compileStderr) => {
      if (compileErr || compileStderr) {
        return fs.unlink(cppFile, () => {
          res.render("index", { output: compileStderr || compileErr.message, code });
        });
      }

      const runProcess = spawn(exeFile); // Windows-safe, no need for "./"
      let output = "", errorOutput = "";

      runProcess.stdout.on('data', (data) => output += data.toString());
      runProcess.stderr.on('data', (data) => errorOutput += data.toString());

      runProcess.on('close', () => {
        fs.unlink(cppFile, () => {
          fs.unlink(exeFile, () => {
            if (errorOutput) return res.render("index", { output: errorOutput, code });
            res.render("index", { output: output, code });
          });
        });
      });

      runProcess.stdin.write(input);
      runProcess.stdin.end();
    });
  });
});

app.post('/Javarun', (req, res) => {
  const code = req.body.code;
  const input = req.body.input || "";
  const uid = crypto.randomUUID();
  const workDir = path.join(tempDir, uid);
  const javaFile = path.join(workDir, "Main.java");

  fs.mkdirSync(workDir);

  fs.writeFile(javaFile, code, (err) => {
    if (err) return res.send("Error writing Java file.");

    exec(`javac "${javaFile}"`, { cwd: workDir }, (compileErr, _, compileStderr) => {
      if (compileErr || compileStderr) {
        return cleanupDir(workDir, () => {
          res.render("index2", { output: compileStderr || compileErr.message, code });
        });
      }

      const runProcess = spawn("java", ["Main"], { cwd: workDir });
      let output = "", errorOutput = "";

      runProcess.stdout.on("data", data => output += data.toString());
      runProcess.stderr.on("data", data => errorOutput += data.toString());

      runProcess.on("close", () => {
        cleanupDir(workDir, () => {
          if (errorOutput) return res.render("index2", { output: errorOutput, code });
          res.render("index2", { output: output, code });
        });
      });

      runProcess.stdin.write(input);
      runProcess.stdin.end();
    });
  });
});

app.post('/Pythonrun', (req, res) => {
  const code = req.body.code;
  const input = req.body.input || "";
  const uid = crypto.randomUUID();
  const filename = path.join(tempDir, `Main_${uid}.py`);

  fs.writeFile(filename, code, (err) => {
    if (err) return res.send("Error writing Python file.");

    const process = spawn("python", [filename]);
    let output = "", errorOutput = "";

    process.stdout.on("data", data => output += data.toString());
    process.stderr.on("data", data => errorOutput += data.toString());

    process.on("close", () => {
      fs.unlink(filename, () => {
        if (errorOutput) return res.render("index3", { output: errorOutput, code });
        res.render("index3", { output: output, code });
      });
    });

    process.stdin.write(input);
    process.stdin.end();
  });
});

app.post('/Javascriptrun', (req, res) => {
  const code = req.body.code;
  const input = req.body.input || "";
  const uid = crypto.randomUUID();
  const filename = path.join(tempDir, `Main_${uid}.js`);

  fs.writeFile(filename, code, (err) => {
    if (err) return res.send("Error writing JavaScript file.");

    const process = spawn("node", [filename]);
    let output = "", errorOutput = "";

    process.stdout.on("data", data => output += data.toString());
    process.stderr.on("data", data => errorOutput += data.toString());

    process.on("close", () => {
      fs.unlink(filename, () => {
        if (errorOutput) return res.render("index4", { output: errorOutput, code });
        res.render("index4", { output: output, code });
      });
    });

    process.stdin.write(input);
    process.stdin.end();
  });
});

function cleanupDir(dirPath, callback) {
  fs.readdir(dirPath, (err, files) => {
    if (err) return callback();
    let pending = files.length;
    if (!pending) return fs.rmdir(dirPath, callback);
    files.forEach(file => {
      fs.unlink(path.join(dirPath, file), err => {
        if (!--pending) fs.rmdir(dirPath, callback);
      });
    });
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
