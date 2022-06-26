const inquirer = require('inquirer');
const mysql = require('mysql2');
const cTable = require('console.table');

const departmentTable = 'SELECT * FROM department';

const roleTable = `SELECT role.id, role.title, department.name AS department, role.salary 
FROM role JOIN department 
ON role.department_id = department.id 
ORDER BY role.id`;

const employeesTable = `SELECT employee.id, employee.first_name, employee.last_name, role.title, role.salary, department.name AS department, CONCAT(m.first_name, ' ', m.last_name) AS manager
FROM employee
INNER JOIN role
ON employee.role_id = role.id
INNER JOIN department
ON role.department_id = department.id
LEFT JOIN employee m
ON employee.manager_id = m.id
ORDER BY employee.id`;

const addDepartment = [
    {
        type: 'input',
        message: 'What is the name of the department?',
        name: 'addDepartment',
        validate: (answer) => {
            if (answer) {
                return true;
            }else{
                console.log('please submit a new department');
                return false;
            }

        }
}];

const info = ()=>{
    return db.query('SELECT * FROM department', (err, result, fields) => {
    const depaArr = result.map((data) => {
        return data.name
    })
    console.log(depaArr);
    return depaArr;
})  
}

const addRole = [
    {
        type: 'input',
        message: 'What is the name of the role?',
        name: 'addRole',
        validate: (answer) => {
            if (answer) {
                return true;
            }else{
                console.log('please submit a new role');
                return false;
            }

        }
    },
    {
        type: 'number',
        message: 'What is the salary of the role?',
        name: 'salary',
        validate: (answer) => {
            if (answer) {
                return true;
            }else{
                console.log('please submit a salary');
                return false;
            }

        }        
    },
    {
        type: 'number',
        message: 'Which department does the role belong to?',
        name: 'department'
        // choices: info()
    }
];

const addEmployee = [
    {
        type: 'input',
        message: 'What is the employee\'s first name?',
        name: 'firstName',
        validate: (answer) => {
            if (answer) {
                return true;
            }else{
                console.log('please submit a first name');
                return false;
            }

        }
    },
    {
        type: 'input',
        message: 'What is the employee\'s last name?',
        name: 'lastName',
        validate: (answer) => {
            if (answer) {
                return true;
            }else{
                console.log('please submit a last name');
                return false;
            }

        }        
    },
    {
        type: 'input',
        message: 'What is the employee\'s role?',
        name: 'role',
        validate: (answer) => {
            if (answer) {
                return true;
            }else{
                console.log('please submit a role');
                return false;
            }

        }        
    },
    {
        type: 'input',
        message: 'Who is the employee\'s manager?',
        name: 'manager',
        validate: (answer) => {
            if (answer) {
                return true;
            }else{
                console.log('please submit a role');
                return false;
            }

        } 
    }    
];

const db = mysql.createConnection(
    {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'employees_db'
    },
    console.log(`Connected to the employees_db database.`)
  );


const init = () => {
inquirer.prompt([{
    type: 'list',
    message: 'What would you like to do?',
    choices: ['view all departments', 'view all roles', 'view all employees', 'add a department', 'add a role', 'add an employee', 'update an employee role'],
    name: 'options'
}]).then((answers) => {
    let {options} = answers;
    console.log(options);
    switch (options) {
        case 'view all departments':
            allDepartmentsTable.printTable();
            break;
        case 'view all roles':
            allRolesTable.printTable();
            break;
        case 'view all employees':
            allEmployeesTable.printTable();
            break;
        case 'add a department':
            allDepartmentsTable.promptQuetions();
            break;
        case 'add a role':
            allRolesTable.promptQuetions();
            break;
        case 'add an employee':
            allEmployeesTable.promptQuetions();
            break;
        case 'update an employee role':
            
            break;       
    
        default:
            break;
    }
    
});

}

class PrintAndPrompt {
    constructor(categorieTable, addingNewInfo){
        this.categorieTable = categorieTable;
        this.addingNewInfo = addingNewInfo;
    }

    printTable (){
        db.query(this.categorieTable, (err, result, fields) => {
            console.table(result);
            init();
        })
    }

    promptQuetions(){
        inquirer.prompt(this.addingNewInfo)
        .then((answers) => {
            const {addDepartment, addRole} = answers;

            if(addDepartment){
                newDepartment(answers);
            }else if(addRole){
                newRole(answers);
            }else{
                newEmployee(answers);
            }

        })
    }
};
const allDepartmentsTable = new PrintAndPrompt(departmentTable, addDepartment);
const allRolesTable = new PrintAndPrompt(roleTable, addRole);
const allEmployeesTable = new PrintAndPrompt(employeesTable, addEmployee);

const newDepartment = (answers) =>{
    const {addDepartment} = answers; 

    db.query('INSERT INTO department (name) VALUES (?)', addDepartment, (err, result, fields) => {
        console.log(`added ${addDepartment} to the database`);
        init();
    })
}

const newRole = (answers) => {
    const {addRole, salary, department} = answers;
    const params = [addRole, salary, department];
    db.query('INSERT INTO role (title, salary, department_id) VALUES (?,?,?)', params, (err, result, fields) => {
        console.log(`Added ${addRole} to the database`)
        init();
    })

}

const newEmployee = (answers) => {
    console.log(answers)
    init()
}

init();