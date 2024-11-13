'use client';

import { Message, useAssistant } from 'ai/react';
import { useEffect, useState } from 'react';

function parseAsteriskText(input: string): {
  firstPart: string;
  correctAnswer: string;
  secondPart: string
} | null {
  const match = input.match(/^(.*?)\*(.*?)\*(.*)$/);

  if (match) {
    const [, firstPart, correctAnswer, secondPart] = match;
    return { firstPart, correctAnswer, secondPart };
  }

  return null;
}

interface ExerciseProps {
  text: string;
  originalForm: string;
}

interface Response {
  exercise: string;
  original_form: string;
}

const AssistentLoader = () => {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDotCount((prev) => (prev === 3 ? 1 : prev + 1));
    }, 250);
    
    return () => clearInterval(intervalId);
  }, []);

  const dots = '.'.repeat(dotCount);
  
  return (
    <div
      className="flex flex-col w-full min-h-10 p-4 rounded bg-zinc-800 animate-fade-in animate-pulse"
    >
      <div className="text-xs mb-2 text-zinc-400">
        Asystent
      </div>
      <div>
        {dots}
      </div>
    </div>
  )
}

const Exercise = ({ text, originalForm }: ExerciseProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const parsedResult = parseAsteriskText(text);
  if (!parsedResult) {
    return (
      <div className='text-red-400'>
        Unexpected format of exercise
      </div>
    )
  }
  const { firstPart, correctAnswer, secondPart } = parsedResult;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (inputValue === correctAnswer) {
        setIsCorrect(true);
      } else {
        setIsCorrect(false);
      }
    }
  };

  return (
    <div className='inline whitespace-pre-wrap my-2 animate-fade-in'>
      <span>
        {firstPart}
      </span>
      <input
        type="text"
        placeholder={originalForm}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className={
          `inline mx-1 mr-2 rounded px-2 text-center
          ${isCorrect === true ? "bg-green-200 text-black" : ""}
          ${isCorrect === false ? "bg-red-200 text-black" : ""}
          ${isCorrect === null ? "bg-zinc-500" : ""}`
        }
        style={{ width: `${correctAnswer.length + 1 }ch`}}
      />
      <span>
        {secondPart}
      </span>
      {isCorrect === false &&
        <span className='mx-4 rounded bg-green-200 px-3 py-0.5 text-black animate-fade-in'>
          {correctAnswer}
        </span>
      }
      {isCorrect === null && inputValue &&
        <span className='mx-4 rounded bg-slate-50 px-3 py-0.5 text-black animate-fade-in'>
          {originalForm}
        </span>
      }
    </div>
  )
}

export default function Page() {
  const { status, messages, input, setMessages, submitMessage, handleInputChange } =
    useAssistant({ api: '/api/assistant' });

  return (
    <div className="flex flex-col gap-2">
      <div className="m-4">
        <button
          onClick={() => setMessages([])}
          className='transition duration-150 ease-in-out rounded bg-purple-700 hover:scale-110 hover:bg-indigo-500 max-w-48 p-2'
        >
          Wyczyść czat
        </button>
      </div>

      <div className="flex flex-col m-4 gap-4">
        {messages.map((message: Message) => {
          if (message.role === 'user') {
            return (
              <div
                key={message.id}
                className="flex flex-col w-full min-h-10 p-4 rounded bg-zinc-800"
              >
                <div className="text-xs mb-2 text-zinc-400">
                  Twoje powiadomienie
                </div>
                <div>{message.content}</div>
              </div>
            );
          }
          const exercises = JSON.parse(message.content).exercises as Response[];
          return (
            <div
              key={message.id}
              className="flex flex-col w-full min-h-10 p-4 rounded bg-zinc-800"
            >
              <div className="text-xs mb-2 text-zinc-400">
                Asystent
              </div>
              {exercises.map((exercise, index) => (
                <Exercise
                  key={`${exercise.original_form}-${index}`}
                  text={exercise.exercise}
                  originalForm={exercise.original_form}
                />
              ))}
            </div>
          );
        })}

        { status === 'in_progress' &&
          <AssistentLoader />
        }

       { status === 'awaiting_message' &&
          <form
            onSubmit={submitMessage}
            className="flex flex-col w-full min-h-10 p-4 rounded bg-zinc-800 animate-fade-in"
          >
            <div className="text-xs mb-2 text-zinc-400">
              Twoje powiadomienie
            </div>
            <input
              disabled={status !== 'awaiting_message'}
              value={input}
              placeholder='Napisz tu temat albo słowo, które chcesz poćwiczyć'
              onChange={handleInputChange}
              className="rounded bg-zinc-800"
            />
          </form>
        }
      </div>
    </div>
  );
}