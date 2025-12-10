import React, { useState } from 'react';
import './App.css'; // Vamos manter o CSS padrão

function App() {
  // 1. Definição do Estado Inicial (Próximo Passo)
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');

  // 2. Funções de Manipulação (Próximo Passo)
  const handleAddTodo = () => {
    // Lógica para adicionar item
  };

  const handleToggleComplete = (id) => {
    // Lógica para marcar como completo
  };

  // 3. Renderização (Próximo Passo)
  return (
    <div className="todo-list-app">
      <h1>Minha Lista de Tarefas (To-Do List)</h1>

      {/* Input e Botão */}
      <div className="input-section">
        <input 
          type="text" 
          placeholder="Adicionar nova tarefa..." 
        />
        <button>Adicionar</button>
      </div>

      {/* Lista de Tarefas */}
      <ul className="todo-items">
        {/* Aqui iremos renderizar os itens */}
      </ul>
    </div>
  );
}

export default App;