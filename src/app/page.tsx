"use client";

import { createClient } from "@liveblocks/client";
import { actions, liveblocksEnhancer } from "@liveblocks/redux";
import { PayloadAction, configureStore, createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";
import { useEffect } from "react";
import { Provider, shallowEqual, useDispatch, useSelector } from "react-redux";

const client = createClient({
  publicApiKey: "pk_test_YQwmruaR10F3T86-tzbm-o-r",
});

interface Todo {
  id: string;
  todo: string;
  sortIndex: number;
}

interface TodoState {
  draft: string;
  isTyping: boolean;
  todos: { [id: string]: Todo };
}

const initialState: TodoState = {
  draft: "",
  isTyping: false,
  todos: {},
};

const slice = createSlice({
  name: "state",
  initialState,
  reducers: {
    setDraft: (state, action: PayloadAction<string>) => {
      state.isTyping = action.payload === "" ? false : true;
      state.draft = action.payload;
    },
    addTodo: (state, action: PayloadAction<string>) => {
      const id = nanoid();
      state.todos[id] = {
        id,
        todo: action.payload,
        sortIndex:
          Math.max(...Object.values(state.todos).map((x) => x.sortIndex)) + 1,
      };
    },
    deleteTodo: (state, action: PayloadAction<string>) => {
      delete state.todos[action.payload];
    },
  },
});

function makeStore() {
  return configureStore({
    reducer: slice.reducer,
    enhancers: [
      liveblocksEnhancer({
        client,
        storageMapping: { todos: true },
        presenceMapping: { isTyping: true } as any,
      }),
    ],
  });
}

const store = makeStore();

function WhoIsHere() {
  const othersUsersCount: any = useSelector(
    (state: { liveblocks: { others: any[] } }) => state.liveblocks.others.length
  );

  return (
    <div className="dark:text-slate-500 text-slate-600 text-xs p-1 font-light flex justify-between">
      <SomeoneIsTyping />
      <div>There are {othersUsersCount} other users online</div>
    </div>
  );
}

export default function Home() {
  return (
    <Provider store={store}>
      <main className="flex flex-col items-center justify-between px-5 max-w-2xl mx-auto">
        <div className="w-full m-4">
          <Inner />
        </div>
      </main>
    </Provider>
  );
}

function SomeoneIsTyping() {
  const others = useSelector((state: any) => state.liveblocks.others);

  return others.some((user: any) => user.presence?.isTyping) ? (
    <div className="someone_is_typing">Someone is typing</div>
  ) : (
    <div></div>
  );
}

function Inner() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(actions.enterRoom("redux-demo-room"));

    return () => {
      dispatch(actions.leaveRoom());
    };
  }, [dispatch]);

  const { todos, draft } = useSelector(
    (state: TodoState) => ({
      todos: state.todos,
      draft: state.draft,
    }),
    shallowEqual
  );

  const sorted = Object.values(todos).sort((a, b) => a.sortIndex - b.sortIndex);

  return (
    <>
      <WhoIsHere />

      <input
        type="text"
        className="dark:bg-slate-800 w-full dark:text:white outline-none p-4 focus:color rounded drop-shadow-md"
        placeholder="Add a new thing to do"
        value={draft}
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            dispatch(slice.actions.addTodo(draft));
            dispatch(slice.actions.setDraft(""));
          }
        }}
        onChange={(e) => {
          dispatch(slice.actions.setDraft(e.currentTarget.value));
        }}
      ></input>

      <div className="flex flex-col m-4">
        {sorted.map((todo) => {
          return (
            <div
              className="dark:text-slate-300 text-slate-600 flex justify-between space-between align-items mt-4"
              key={todo.id}
            >
              <div>{todo.todo}</div>
              <button
                onClick={() => dispatch(slice.actions.deleteTodo(todo.id))}
              >
                &#x2715;
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
