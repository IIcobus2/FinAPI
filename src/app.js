const { request, json } = require('express')
const express   = require('express')
const app       = express()
const { v4: uuidv4 }       = require('uuid')
const PORT = 3000
app.use(express.json())

app.listen(PORT, () => console.log(`APP is listening on PORT ${PORT}!`))

const customers = []

// Middleware = Funções de validação, etc que fica entre as requisições

let verifyIfExistsAccountCPF = (req,res,next) => {
    const { cpf } = req.headers
    console.log(cpf)
    const customer = customers.find((customer) => cpf === customer.cpf);
    
    if (!customer) {
        return res.status(404).json({ error: 'Customer not found' })
    }
    
    req.customer = customer
    return next()
}

let verifyIsAmountValid = (req,res,next) => {
    const { amount } = req.headers
    if (amount < 0 || amount == 0 ) return res.status(400).json({ error: 'Invalid params' })
    
    req.amount = amount
    return next()
}

let calculateBalance = (customer) => {
    let balance = 0;
  
    customer.statement.forEach(element => {
      if(element.type === "credit") 
        balance += element.amount
      else
        balance -= element.amount
    });
  
    return balance;
}
  
let movimentBalance = (customer, op, ...amount) => {
    if(op === "credit") {
        customer.balance = calculateBalance(customer);
    } else if(op === "debit") {
        customer.balance -= amount;
    } 
    return customer.balance;
}

// let getBalance = (statement) => {
//     const balance = statement.reduce((acc, operation) => {
//         if(operation.type === "credit")
//             acc += operation.amount
//         else
//             acc -= operation.amount
//         return acc
//     }, 0)

//     return balance
// }
app.get('/', (req, res) => res.json(customers))

app.get('/search_client',verifyIfExistsAccountCPF , (req, res) => {
    const { cpf } = req.headers
    
    const customer = customers.find((customer) => cpf === customer.cpf)
    res.status(200).json(customer)
})

// passing cpf by params
// app.get('/statement/:cpf', (req, res) => {
    //     const { cpf } = req.params
    //     const customerFinded = customers.find((customer) => cpf === customer.cpf);
//     if (!customerFinded) {
//         res.status(404).json({ error: 'Customer not found' })
//     }else{
//         res.status(200).json(customerFinded.statement)
//     }
// })

// passing cpf by headers
// app.use(verifyIfExistsAccountCPF)
// app.get('/statement', verifyIfExistsAccountCPF, middleware1, middleware1, ... (req, res) => {
    
app.get('/statement', verifyIfExistsAccountCPF, (req, res) => { 
        // verifyIfExistsAccountCPF(req, res)
        const { customer } = req
    res.status(200).json({statement:customer.statement, balance: customer.balance})
})

app.get('/balance', verifyIfExistsAccountCPF, (req, res) => { 
    const { customer } = req
    res.status(200).json({name: customer.name, balance: customer.balance})
})

app.get('/statement/date', verifyIfExistsAccountCPF, (req, res) => { 
    const { customer } = req
    console.log(customer)
    const { date } = req.query
    
    const dateFormat = new Date(date+" 00:00")
    const statement = customer.statement.filter((stat) =>  stat.created_at.toDateString() === dateFormat.toDateString() );
    
    res.status(200).json(statement)
})

app.post('/account', function (req, res) {
    const { name,cpf } = req.body
    const id = uuidv4()
    
    
    const customerAlreadyExists = customers.some((customer) => cpf === customer.cpf);
    if(!customerAlreadyExists){
        customers.push({id,name,cpf,statement: [], balance: 0});
        res.status(201).json({message: "Success"})
    }else{
        res.status(400).json({error: "Customer already exists"})
    }
})  

app.post('/deposit', verifyIfExistsAccountCPF, verifyIsAmountValid,  function (req, res) {
    const { amount, description } = req.body
    const { customer } = req
    
    customer.statement.push({ description, amount:Number.parseFloat(amount), created_at: new Date(), type: "credit"})
    
    movimentBalance(customer, "credit")
    res.status(201).json(customer).send()
    
})

app.post('/withdraw', verifyIfExistsAccountCPF, verifyIsAmountValid, function (req, res) {
    const { amount } = req.body
    const { customer } = req
    
    if(amount > customer.balance) return res.status(400).json({ error: 'Insufficient funds' })

    customer.statement.push({  amount:Number.parseFloat(amount), created_at: new Date(), type: "debit"})

    movimentBalance(customer, "debit", amount)
    res.status(201).json(customer).send()
    
})

app.put('/update_account', verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req
    const { name } = req.body

    customer.name = name
    res.status(201).json(customer)
})

app.delete('/account', verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req
    customers.splice(customers.indexOf(customer), 1)

    res.status(201).json(customers)
})

app.patch('/update_account', verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req
    const { name } = req.body

    customer.name = name
    res.status(201).json(customer)
})
