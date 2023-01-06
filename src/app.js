const { request, json } = require('express')
const express   = require('express')
const app       = express()
const { v4: uuidv4 }       = require('uuid')
const PORT = 3000
app.use(express.json())

const customers = []

// Middleware = Funções de validação, etc que fica entre as requisições

let verifyIfExistsAccountCPF = (req,res,next) => {
    const { cpf } = req.headers
    const customer = customers.find((customer) => cpf === customer.cpf);

    if (!customer) {
        res.status(404).json({ error: 'Customer not found' })
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


app.listen(PORT, () => console.log(`APP is listening on PORT ${PORT}!`))

app.get('/', (req, res) => res.send('Hello World!'))


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
    res.status(200).json(customer.statement)
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
    const { customer } = req
    const { amount, description } = req.headers
    
    customer.statement.push({ description, amount:Number.parseFloat(amount), created_at: new Date(), type: "credit"})
    
    movimentBalance(customer, "credit")
    res.status(200).json(customer).send()
    
})

app.post('/withdraw', verifyIfExistsAccountCPF, verifyIsAmountValid, function (req, res) {
    const { customer } = req
    const { amount, description } = req.headers
    
    if(amount > customer.balance) return res.status(400).json({ error: 'Insuficient balance' })

    customer.statement.push({ description, amount:Number.parseFloat(amount), created_at: new Date(), type: "debit"})

    movimentBalance(customer, "debit", amount)
    res.status(200).json(customer).send()
    
})

let movimentBalance = (customer, op, ...amount) => {
    let aux = 0
    
    if(op === "credit"){
        customer.statement.forEach(element => { 
                aux += element.amount
            }
        )
    }else if(op === "debit"){
        customer.balance = customer.balance - amount
        return customer.balance
    } 
    customer.balance = aux
    return customer.balance
}


app.get('/statementbydate', (req, res) => { 
    const { created_at } = req.headers
    if (created_at > 31 || created_at < 0) return res.status(400).json({ error: 'Invalid params' })
    const found = customers.find((customer) => customer.statement.find((stat) => stat.created_at.getDate() == created_at) );
    if (!found) 
        res.status(404).json({ error: 'Customer not found' })
    else
        res.status(200).json({
            statusCode: 200,
            name: found.name,
            statement: found.statement,
            balance: found.balance
        })
})