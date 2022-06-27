const inquirer = require('inquirer');
const mysql = require('mysql2');
const cTable = require('console.table');
const { exit } = require('process');
const { readSync } = require('fs');

const db = mysql.createConnection(
    {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'employees_db'
    },
    console.log(`Connected to the employees_db database.`)
  );

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

const init = () => {
    
inquirer.prompt([{
    type: 'list',
    message: 'What would you like to do?',
    choices: ['view all departments', 'view all roles', 'view all employees', 'add a department', 'add a role', 'add an employee', 'update an employee role', 'Quit'],
    name: 'options'
}]).then((answers) => {
    let {options} = answers;

    switch (options) {
        case 'view all departments':
            departmentsFunction.printTable();
            break;
        case 'view all roles':
            rolesFunction.printTable();
            break;
        case 'view all employees':
            employeesFunction.printTable();
            break;
        case 'add a department':
            departmentsFunction.promptQuestions();
            break;
        case 'add a role':
            newRole();
            break;
        case 'add an employee':
            newEmployee();
            break;
        case 'update an employee role':
            updateEmployee();
            break;       
    
        default:
            exit();
            
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
            if (err) throw err; 
            console.table(result);
            init();
        
        })
    }

    promptQuestions(){
        inquirer.prompt(this.addingNewInfo)
        .then((answers) => {
            const {addDepartment, addRole, firstName} = answers;

            if(addDepartment){
                newDepartment(answers);
            }else if(addRole){
                newRole(answers);
            }else if(firstName){
                newEmployee(answers);
            }else{
                updateEmployee(answers);
            }

        })
    }
};
const departmentsFunction = new PrintAndPrompt(departmentTable, addDepartment);
const rolesFunction = new PrintAndPrompt(roleTable);
const employeesFunction = new PrintAndPrompt(employeesTable);

const newDepartment = (answers) =>{
    const {addDepartment} = answers; 

    db.query('INSERT INTO department (name) VALUES (?)', addDepartment, (err, result, fields) => {
        console.log(`added ${addDepartment} to the database`);
        init();
    })
}

const newRole = (answers) => {

    if(!answers){
        db.query('SELECT * FROM department', (err, result, fields) => {
            if (err) throw err; 
            const choicesArr = result.map((data) => data.name);
            
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
                    type: 'list',
                    message: 'Which department does the role belong to?',
                    name: 'department',
                    choices: choicesArr
                    
                }
            ];
            
            const rolesFunction = new PrintAndPrompt(roleTable, addRole);
            
            rolesFunction.promptQuestions();
            
        })
        
    }else{

        db.query('SELECT * FROM department', (err, result, fields) => {
            if (err) throw err; 
            const {addRole, salary, department} = answers;
    
            const roleDepaArr = result.filter((data) => department === data.name );
            const depaId = roleDepaArr[0].id;
           
            const params = [addRole, salary, depaId];
            db.query('INSERT INTO role (title, salary, department_id) VALUES (?,?,?)', params, (err, result, fields) => {
                if (err) throw err; 
                console.log(`Added ${addRole} to the database`)
                init();
            })
        })
    }
}

const newEmployee = (answers) => {

    if(!answers){
        db.query('SELECT * FROM role', (err, result, fields) => {
            if (err) throw err; 
            const choicesRoleArr = result.map((data) => data.title);

            db.query(`SELECT id, CONCAT(first_name, ' ', last_name) AS Employees FROM employee`, (err, result, fields) => {
                if (err) throw err; 

                const choicesManagerArr = result.map((data) => data.Employees);
                choicesManagerArr.push('None');
            
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
                        type: 'list',
                        message: 'What is the employee\'s role?',
                        name: 'role',
                        choices: choicesRoleArr        
                    },
                    {
                        type: 'list',
                        message: 'Who is the employee\'s manager?',
                        name: 'manager',
                        choices: choicesManagerArr
                    }    
                ];

                const employeesFunction = new PrintAndPrompt(roleTable, addEmployee);
                
                employeesFunction.promptQuestions();

            })
            
        })
    }else{

        db.query('SELECT * FROM role', (err, result, fields) => {
            if (err) throw err; 
            const {firstName, lastName, role, manager} = answers;
    
            const roleArr = result.filter((data) => role === data.title);
            const roleId = roleArr[0].id;
    

            db.query(`SELECT id, CONCAT(first_name, ' ', last_name) AS Employees FROM employee`, (err, result, fields) => {
                if (err) throw err; 

                if (manager === 'None') {

                    const params = [firstName, lastName, roleId, null];
                    db.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?,?,?,?)', params, (err, result, fields) => {
                        if (err) throw err; 
                        console.log(`Added ${firstName + ' ' + lastName} to the database`)
                        init();
                    })

                } else {
                    
                    const managerArr = result.filter((data) => manager === data.Employees);
                    const managerId = managerArr[0].id;
    
                    const params = [firstName, lastName, roleId, managerId];
                    db.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?,?,?,?)', params, (err, result, fields) => {
                        if (err) throw err; 
                        console.log(`Added ${firstName + ' ' + lastName} to the database`)
                        init();
                    })
                }

            })
        })

    }
}

const updateEmployee = (answers) => {

    if (!answers) {
        
        db.query(`SELECT id, CONCAT(first_name, ' ', last_name) AS Employees FROM employee`, (err, result, fields) => {
            if (err) throw err; 
            const choicesEmpArr = result.map((data) => data.Employees);

            db.query('SELECT * FROM role', (err, result, fields) => {
                if (err) throw err; 
                const choicesNewRoleArr = result.map((data) => data.title);

                updateEmployeeQuestions = [
                    {
                        type: 'list',
                        message: 'Which employee\'s role do you want to update?',
                        name: 'employee',
                        choices: choicesEmpArr

                    },
                    {
                        type: 'list',
                        message: 'Which role do you want to assign the selected employee?',
                        name: 'newRole',
                        choices: choicesNewRoleArr

                    }
                ];

                const promptUpdateEmployee = new PrintAndPrompt(null,updateEmployeeQuestions);

                promptUpdateEmployee.promptQuestions();
            })    
        })
    } else {
        
        db.query(`SELECT id, CONCAT(first_name, ' ', last_name) AS Employees FROM employee`, (err, result, fields) => {
            if (err) throw err; 
            const {employee, newRole} = answers;

            const employeeArr = result.filter((data) => employee === data.Employees);
            const employeeId = employeeArr[0].id;

            db.query('SELECT * FROM role', (err, result, fields) => {
                if (err) throw err;

                const roleArr = result.filter((data) => newRole === data.title);
                const roleId = roleArr[0].id;

                db.query(`UPDATE employee SET role_id = ${roleId} WHERE id = ${employeeId}`, (err, result, fields) => {
                   if (err) throw err;
                    console.log(`${employee} role has been updated`);
                    init();

                })

            })

        })
        
    }    
}


init();
