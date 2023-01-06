const express   = require('express')
const app       = express()
const { v4: uuidv4 }       = require('uuid')
const PORT = 3000
app.use(express.json())

const customers = []


app.listen(PORT, () => console.log(`APP is listening on PORT ${PORT}!`))

app.get('/', (req, res) => res.send('Hello World!'))

app.get('/statement/:cpf', (req, res) => {
    const { cpf } = req.params
    const customerFinded = customers.find((customer) => cpf === customer.cpf);
    if (!customerFinded) {
        return res.status(404).json({ error: 'Customer not found' })
    }else{
        return res.status(200).json(customerFinded.statement)
    }
})

app.post('/account', function (req, res) {
    const { name,cpf } = req.body
    const id = uuidv4()

    
    const customerAlreadyExists = customers.some((customer) => cpf === customer.cpf);
    if(!customerAlreadyExists){
        customers.push({id,name,cpf,statement: []})
        res.status(201).json({message: "Success"})
    }else{
        res.status(400).json({error: "Customer already exists"})
    }
})  