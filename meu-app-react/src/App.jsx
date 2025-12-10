import React, { useState } from 'react';
import './App.css'; // Vamos manter o CSS padrão

function App() {
  // 1. Definição do Estado Inicial (Próximo Passo)
  const [todos, setTodos] = useState([
    { id: 1, text: 'Aprender React Hooks', completed: false },
    { id: 2, text: 'Construir a To-Do List', completed: true },
  ]);
  const [inputValue, setInputValue] = useState('');

  // 2. Funções de Manipulação (Próximo Passo)
  const handleAddTodo = () => {
    // Lógica para adicionar item
    // 1. Impede a adição de tarefas vazias
    if (inputValue.trim() === '') {
      return;
    }

    // 2. Cria o novo objeto de tarefa
    const newTodo = {
      // IDs simples (para fins de aprendizado)
      id: Date.now(),
      text: inputValue,
      completed: false,
    };

    // 3. Atualiza o estado `todos` **mantendo** os itens existentes.
    // IMPORTANTE: Nunca modifique o array de estado diretamente (ex: todos.push()).
    // Sempre crie um **novo array** (usando o operador spread `...`) e o passe para o setter.
    setTodos([...todos, newTodo]);

    // 4. Limpa o input após a adição
    setInputValue('');
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
          value={inputValue} // O valor atual do input é sempre o estado
          onChange={(e) => setInputValue(e.target.value)} // Atualiza o estado em cada tecla
        />
        <button onClick={handleAddTodo}>Adicionar</button>
      </div>

      {/* Lista de Tarefas */}
      <ul className="todo-items">
        {/* Aqui iremos renderizar os itens */
          todos.map(todo => (
            <li
              key={todo.id} // **CHAVE ESSENCIAL:** Ajuda o React a identificar itens
              className={todo.completed ? 'completed' : ''} // CSS para itens completos
            >
              <span className="todo-text">
                {todo.text}
              </span>
              {/* Botão para marcar/desmarcar */}
              <button>
                {todo.completed ? 'Desmarcar' : 'Completar'}
              </button>
            </li>
          ))}

      </ul>
    </div>
  );
}

export default App;