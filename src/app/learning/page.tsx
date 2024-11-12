'use client';

import { Message, useAssistant } from 'ai/react';
import { useState } from 'react';

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
    console.log('haha', e)
    if (e.key === "Enter") {
      if (inputValue === correctAnswer) {
        setIsCorrect(true);
      } else {
        setIsCorrect(false);
      }
    }
  };

  return (
    <div className='inline whitespace-pre-wrap my-2'>
      <span>
        {firstPart}
      </span>
      <input
        type="text"
        placeholder={originalForm}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        // disabled={isCorrect !== null}
        className={
          `inline mx-1 mr-2 rounded bg-zinc-500 px-2 text-center
          ${isCorrect === true ? "bg-green-200 text-black" : ""}
          ${isCorrect === false ? "bg-red-200 text-black" : ""}`
        }
        style={{ width: `${correctAnswer.length + 1 }ch`}}
      />
      <span>
        {secondPart}
      </span>
      {isCorrect === false &&
        <span className='mx-4 text-green-200'>
          {correctAnswer}
        </span>
      }
    </div>
  )
}

export default function Page() {
  const { status, messages, input, submitMessage, handleInputChange } =
    useAssistant({ api: '/api/assistant' });

  return (
    <div className="flex flex-col gap-2">
      <div className="p-2">status: {status}</div>

      <div className="flex flex-col m-4 gap-4">
        {messages.map((message: Message) => {
          if (message.role === 'user') {
            return (
              <div
                key={message.id}
                className="flex flex-col w-full min-h-10 p-3 rounded bg-zinc-800"
              >
                <div className="text-xs mb-2 text-zinc-400">
                  Twoje powiadomienie
                </div>
                <div>{message.content}</div>
              </div>
            );
          }
          const exercises = JSON.parse(message.content).exercises
          return (
            <div
              key={message.id}
              className="flex flex-col w-full min-h-10 p-3 rounded bg-zinc-800"
            >
              <div className="text-xs mb-2 text-zinc-400">
                Asystent
              </div>
              {/* {exercises.map(exercise => (
                <div key={exercise.original_form} className='flex'>
                  <div className="w-full">{exercise.exercise}</div>
                  <div className="w-full">{exercise.original_form}</div>
                </div>
              ))} */}
              {exercises.map(exercise => (
                <Exercise
                  text={exercise.exercise}
                  originalForm={exercise.original_form}
                />
              ))}
            </div>
          );
        })}
      </div>

      <form
        onSubmit={submitMessage}
        className="flex flex-col w-full min-h-10 mx-4 p-3 rounded bg-zinc-800"
      >
        <div className="text-xs mb-2 text-zinc-400">
          Twoje powiadomienie
        </div>
        <input
          disabled={status !== 'awaiting_message'}
          value={input}
          onChange={handleInputChange}
          className="rounded bg-zinc-800 px-2"
        />
      </form>
    </div>
  );
}