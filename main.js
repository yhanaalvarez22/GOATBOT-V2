const { addUser, rmStates, createUser, deleteUser } = require('./main/system/editconfig.js');
const log = require("./main/utility/logs.js");
const logger = require("./main/utility/logs.js");
const axios = require("axios");
const chalk = require('chalk');
const { readdirSync, readFileSync, writeFileSync } = require("fs-extra");
const { join, resolve } = require('path')
const { execSync, exec } = require('child_process');
const path = require('path');
const configLog = require('./main/utility/config.json');
const login = require("./main/system/ws3-fca/index.js");
const listPackage = JSON.parse(readFileSync('package.json')).dependencies;
const packages = JSON.parse(readFileSync('package.json'));
const fs = require("fs-extra")
const process = require('process');
const moment = require("moment-timezone");
const express = require("express");
const app = express();
const port = 8090 || 9000 || 5555 || 5050 || 5000 || 3003 || 2000 || 1029 || 1010;
const dotenv = require('dotenv');
const cron = require('node-cron');
dotenv.config();

// GLOBALS
global.client = new Object({
    commands: new Map(),
    events: new Map(),
    accounts: new Map(),
    cooldowns: new Map(),
    mainPath: process.cwd(),
    eventRegistered: new Array(),
    configPath: new String(),
    envConfigPath: new String(),
    handleSchedule: new Array(),
    handleReaction: new Array(),
    handleReply: new Array(),
    onlines: new Array()
});

global.data = new Object({
    threadInfo: new Map(),
    threadData: new Map(),
    userName: new Map(),
    userBanned: new Map(),
    threadBanned: new Map(),
    commandBanned: new Map(),
    threadAllowNSFW: new Array(),
    allUserID: new Array(),
    allCurrenciesID: new Array(),
    allThreadID: new Map()
});

global.config = new Object();
global.envConfig = new Object();
global.accounts = new Array();
global.nodemodule = new Object();
global.configModule = new Object();
global.moduleData = new Array();
global.language = new Object();
global.utils = require('./main/utility/utils.js');
global.send = require("./main/utility/send.js");
global.editBots = require("./main/system/editconfig.js");

app.use(express.json());

// AUTO UPDATE
console.clear();
console.log(chalk.blue('LOADING MAIN SYSTEM'));
const download = require('download-git-repo');
const currentVersion = packages.version;
const repoOwner = 'ryukodeveloper'; 
const repoName = 'Ryuko-V5';

async function checkForUpdates() {
    try {
        const res = await axios.get(`https://raw.githubusercontent.com/${repoOwner}/${repoName}/refs/heads/main/package.json`);
        const latestVersion = res.data.version;
        logger.update(`checking updates please wait...`);
        if (latestVersion > currentVersion) {
            logger.update(`new version available : ${latestVersion}`);
            return await update(); 
        } else {
            logger.update(`you're using the latest version`);
        }
    } catch (error) {
        console.error('error checking updates : ', error);
    }
}

async function update() {
    const backupDir = 'backup';
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }
    const filesToBackup = ['main/system/database/botdata' ,'states', 'script', 'bots.json'];
    filesToBackup.forEach(async (file) => {
        const backupFile = `${backupDir}/${file}`;
        logger.backup(`moving ${file} to ${backupDir}..`);
        await fs.copy(file, backupFile, {overwrite:true});
        logger.backup(`moved ${file} to ${backupDir}`);
    });
    logger.download(`downloading the updated file into updated folder...`);
    await download('direct:https://github.com/ryukodeveloper/Ryuko-V5.git#main','updated', { clone: true }, async (err) => {
        if (err) {
            return logger.error(`an error occurred while downloading updates`);
        }
        logger.download(`downloaded updates successfully`);
        logger.update(`installing the update to main branch....`);
        await reformatMain();
        logger.update(`installing backup files...`);
        await installBackup();
        logger.update(`removing trash folder...`);
        await removeTrash();
        logger.update(`reinstalling dependencies...`);
        await reinstallDep();
        logger.update(`restarting to save changes...`);
        return process.exit(1);
    });
    async function reinstallDep() {
        try {
            await execSync(`npm install --save`, {
                stdio: 'inherit',
                env: process.env,
                shell: true,
                cwd: join('./node_modules')
            });
            require.cache = {};
            logger.install(`successfully reinstalled dependencies.`)
        } catch (err) {
            logger.error(`failed to reinstall dependencies`)
        }
    }
    async function removeTrash() {
        await exec(`rm -rf updated`);
        await exec(`rm -rf backup`);
        logger.install(`removed successfully.`);
    }
    async function reformatMain() {
        const updatePath = `./updated`
        const listsFile = readdirSync(updatePath);
        for (const files of listsFile) {
            const updatedv = `updated/${files}`;
            try {
                logger.install(`moving ${files} to main branch...`);
                await fs.copy(updatedv, process.cwd()+`/${files}`, {overwrite:true});
                await exec(`rm -rf ${updatedv}`);
                logger.install(`moved ${files} to main branch.`);
            } catch (err) {
                logger.error(`an error occurred when moving ${files} in main branch : ${err}`);
                continue;
            }
        }
    }
    async function installBackup() {
        const backupPath = './backup';
        const listFile = readdirSync(backupPath);
        for (const files of listFile) {
            const backups = `backup/${files}`;
            try {
                logger.install(`moving backup file ${files} to main branch...`)
                await fs.copy(backups, process.cwd()+`/${files}`, {overwrite: true});
                await exec(`rm -rf ${backups}`);
                logger.install(`moved backup file ${files} to main branch.`)
            } catch (err) {
                logger.error(`an error occurred while moving the ${files} in main branch`);
                continue;
            }
        }
    }
}
setInterval(checkForUpdates, 3600000);

// APPLICATION DEPLOYMENT
const jwt = require('jsonwebtoken');
app.post('/login', async (req, res) => {
    const { loginPassword } = req.body;

    try {
        const data = await fs.readFile('config.json', 'utf8');
        const config = JSON.parse(data);
        if (loginPassword === config.adminpass) {
            const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: '1h' });
            return res.status(200).send({ token });
        } else {
            const error = `invalid admin password`;
            return res.status(401).send({error});
        }
    } catch (err) {
        console.error(err);
        const error = `an error occurred while processing your request`
        return res.status(500).send({error});
    }
});
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "main/webpage/index.html"));
});

app.get('/create.html', (req, res) => {
    const token = req.query.token;
    if (!token) {
        return res.status(401).sendFile(path.join(__dirname, 'main/webpage/notfound.html'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).sendFile(path.join(__dirname, 'main/webpage/notfound.html'));
        }
        res.sendFile(path.join(__dirname, 'main/webpage/create.html'));
    });
});

app.post('/create', async (req, res) => {
    const fileName = req.body.fileName;
    const appState = req.body.appstate;
    const botemail = req.body.botemail;
    
    const botpassword = req.body.botpassword;
    const { isAppstate, botName, botPrefix, botAdmin } = req.body;
    const filePath = './states/'+fileName + '.json';
    const botsPath = require(`./bots.json`);
    const stateFolder = "./states"
    const listStates = readdirSync(stateFolder).filter(state => state.endsWith('.json'));
    for (const name of listStates) {
        const stateName = path.parse(name).name;
        if (stateName === fileName) {
            var error = `file name is already exist, try another name`;
            return res.status(400).send({error});
        }
    }
    if (botsPath.find(bot => bot.botname === botName)) {
        var error = `bot name is already exist, try another bot name`;
        return res.status(400).send({error});
    }
    if (isAppstate) {
        try {
            const appcontent = appState;
            const appstateData = JSON.parse(appcontent);
            const loginOptions = {};
            loginOptions.appState = appstateData;
            log.login(global.getText("main", "loggingIn", chalk.blueBright(fileName)));
            await appstateLogin(res, loginOptions, fileName, botName, botPrefix, botAdmin);
        } catch (err) {
            var error = `your appstate is invalid, try to get a new appstate`;
            return res.status(400).send({error});
        }
    } else {
        log.login(global.getText("main", "loggingIn", chalk.blueBright(fileName)));
        await credentialLogin(res, botemail, botpassword , fileName, botName, botPrefix, botAdmin, botemail, botpassword);
    }
});

app.get('/info', (req, res) => {
    const data = Array.from(global.client.accounts.values()).map(account => ({
        name: account.name,
        profileUrl: account.profileUrl,
        thumbSrc: account.thumbSrc,
        time: account.time
    }));
    res.json(JSON.parse(JSON.stringify(data, null, 2)));
});
app.get('/listBots', (req, res) => {
    const data = Array.from(global.client.accounts.values()).map(account => ({
        name: account.name,
        botId: account.botid
    }));
    res.json(JSON.parse(JSON.stringify(data, null, 2)));
});
app.post("/editbotss", async (req, res) => {
    const {botid, content, type} = req.body;
    const filePath = 'bots.json';
    async function updateBotData(id, value, where) {
        delete require.cache[require.resolve('./bots.json')];
        var data;
        var error;
        const configData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const pointDirect = configData.find(bot => bot.uid === botid);
        pointDirect[where] = value;
        try {
            await fs.writeFileSync(filePath, JSON.stringify(configData, null, 2))
            data = `successfully edited the ${where} of ${botid}`;
            res.send({data});
        } catch (err) {
            error = `an error occured while editing ${where}`;
            return res.status(500).send({ error });
        }
    }
    async function addBotAdmin(id, value) {
        delete require.cache[require.resolve('./bots.json')];
        var data;
        var error;
        const configData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const pointDirect = configData.find(bot => bot.uid === botid).admins;
        pointDirect.push(value)
        try {
            await fs.writeFileSync(filePath, JSON.stringify(configData, null, 2))
            data = `successfully added admin`;
            res.send({data});
        } catch (err) {
            error = `an error occured while adding admin`;
            return res.status(500).send({ error });
        }
    }
    switch(type) {
        case "botname":
            await updateBotData(botid, content, 'botname');
            break;
        case "botprefix":
            await updateBotData(botid, content, 'prefix');
            break;
        case "botadmin":
            await addBotAdmin(botid, content);
            break;
    }
});
app.post("/configure", (req, res) => {
    const {content, type} = req.body;
    const filePath = 'config.json';
    async function updateConfigData(value, where) {
        delete require.cache[require.resolve('./config.json')];
        var data;
        var error;
        const configData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        configData[where] = value;
        try {
            await fs.writeFileSync(filePath, JSON.stringify(configData, null, 2))
            data = `successfully changed the value of ${where}`;
            res.send({data});

        } catch (err) {
            error = `error editing ${where}`;
            return res.status(500).send({ error });
        }
    }
    async function addConfigData(value, where) {
        delete require.cache[require.resolve('./config.json')];
        var data;
        var error;
        const configPath = './config.json'
        const config = require("./config.json");
        const here = config[where];
        if (here.includes(value)) {
            error = `${value} is already in ${where}`;
            return res.status(500).send({ error });
        }
        here.push(value);
        try {
            await fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

            data = `successfully added value of ${where}`;
            res.send({data}); 
        } catch (err) {
            error = `error adding value in ${where}`;
            return res.status(500).send({ error });
        }
    }
    async function edit(contentt, typee) {
        switch (typee) {
            case "Email":
                return await updateConfigData(contentt, 'email');
            case "Operator":
                return await addConfigData(contentt, 'operators');
        }
    }
    edit(content, type);
});
app.listen(port);

// LOAD CONFIG FILE
var configValue;
try {
    const configPath = "./config.json";
    global.client.configPath = configPath;
    configValue = require(global.client.configPath);
    log(`loading ${chalk.blueBright(`config`)} file.`, "load");
} catch (err) {
    return log(`cant load ${chalk.blueBright(`configPath`)} in client.`, "error");
    process.exit(0);
}
try {
    for (const Keys in configValue) global.config[Keys] = configValue[Keys];
    log(`loaded ${chalk.blueBright(`config`)} file.`, "load");
} catch (err) {
    return log(`can't load ${chalk.blueBright(`config`)} file.`, "error");
    process.exit(0)
}

// LOAD LANGUAGE
const langFile = (readFileSync(`${__dirname}/main/utility/languages/${global.config.language}.lang`, {
    encoding: 'utf-8'
})).split(/\r?\n|\r/);
const langData = langFile.filter(item => item.indexOf('#') != 0 && item != '');
for (const item of langData) {
    const getSeparator = item.indexOf('=');
    const itemKey = item.slice(0, getSeparator);
    const itemValue = item.slice(getSeparator + 1, item.length);
    const head = itemKey.slice(0, itemKey.indexOf('.'));
    const key = itemKey.replace(head + '.', '');
    const value = itemValue.replace(/\\n/gi, '\n');
    if (typeof global.language[head] == "undefined") global.language[head] = new Object();
    global.language[head][key] = value;
}
global.getText = function(...args) {
    const langText = global.language;
    if (!langText.hasOwnProperty(args[0])) {
        throw new Error(`${__filename} - not found key language : ${args[0]}`);
    }
    var text = langText[args[0]][args[1]];
    if (typeof text === 'undefined') {
        throw new Error(`${__filename} - not found key text : ${args[1]}`);
    }
    for (var i = args.length - 1; i > 0; i--) {
        const regEx = RegExp(`%${i}`, 'g');
        text = text.replace(regEx, args[i + 1]);
    }
    return text;
};


//ENV CONFIG FILE
var envconfigValue;
try {
    const envconfigPath = "./main/config/envconfig.json";
    global.client.envConfigPath = envconfigPath;
    envconfigValue = require(global.client.envConfigPath);
} catch (err) {
    process.exit(0);
}
try {
    for (const envKeys in envconfigValue) global.envConfig[envKeys] = envconfigValue[envKeys];
} catch (err) {
    process.exit(0)
}

// GLOBAL NODE MODULES
const{ Sequelize, sequelize } = require("./main/system/database/index.js");
const { kStringMaxLength } = require('buffer');
const { error } = require('console');
for (const property in listPackage) {
    try {
        global.nodemodule[property] = require(property)
    } catch (e) { }
}



if (!global.config.email) {
    logger(global.getText('main', 'emailNotfound', chalk.blueBright('config.json')), 'err');
    process.exit(0);
}

// LOAD COMMANDS
const commandsPath = "./script/commands";
const commandsList = readdirSync(commandsPath).filter(command => command.endsWith('.js') && !global.config.disabledcmds.includes(command));

console.log(chalk.blue(global.getText('main', 'startloadCmd')));
for (const command of commandsList) {
    try {
        const module = require(`${commandsPath}/${command}`);
        const { config} = module;
        if (!config?.name) {
            try {
                throw new Error(global.getText("main", "cmdNameErr", chalk.red(command)));
            } catch (err) {
                logger.commands(err.message);
                continue;
            }
        }
        if (!config?.category) {
            try {
                throw new Error(global.getText("main", "cmdCategoryErr", chalk.red(command)));
            } catch (err) {
                logger.commands(err.message);
                continue;
            }
        }
        if (global.config.premium) {
            if (!config?.premium) {
                try {
                    throw new Error(global.getText("main", "premiumCmdErr", chalk.red(command)));
                } catch (err) {
                    logger.commands(err.message);
                    continue;
                }
            }
        }
        if (!config?.hasOwnProperty('prefix')) {
            try {
                throw new Error(global.getText("main", "prefixCmdErr", chalk.red(command)), "error");
            } catch (err) {
                logger.commands(err.message);
                continue;
            }
        }
        const { dependencies, envConfig } = config;
        if (dependencies) {
            Object.entries(dependencies).forEach(([reqDependency, dependencyVersion]) => {
                if (listPackage[reqDependency]) return;
                try {
                    execSync(`npm install --save ${reqDependency}${dependencyVersion ? `@${dependencyVersion}` : ''}`, {
                        stdio: 'inherit',
                        env: process.env,
                        shell: true,
                        cwd: join('./node_modules')
                    });
                    require.cache = {};
                } catch (error) {
                    const errorMessage = `failed to install package ${reqDependency}\n`;
                    logger.error(errorMessage);
                }
            });
        }
        if (envConfig) {
            const moduleName = config.name;
            global.configModule[moduleName] = global.configModule[moduleName] || {};
            global.envConfig[moduleName] = global.envConfig[moduleName] || {};
            for (const envConfigKey in envConfig) {
                global.configModule[moduleName][envConfigKey] = global.envConfig[moduleName][envConfigKey] ?? envConfig[envConfigKey];
                global.envConfig[moduleName][envConfigKey] = global.envConfig[moduleName][envConfigKey] ?? envConfig[envConfigKey];
            }
            var envConfigPath = require("./main/config/envconfig.json");
            var configPah = "./main/config/envconfig.json";
            envConfigPath[moduleName] = config.envConfig;
            fs.writeFileSync(configPah, JSON.stringify(envConfigPath, null, 4), 'utf-8');
        }
        if (global.client.commands.has(config.name || "")) {
            try {
                throw new Error(global.getText("main", "commandNameExist", chalk.red(command)));
            } catch (err) {
                logger.commands(err.message);
                continue;
            }
        }
        if (module.handleEvent) global.client.eventRegistered.push(config.name);
        global
