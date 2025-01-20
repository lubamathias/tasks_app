import { GetServerSideProps } from "next";
import { authOptions } from "../api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
import { Session } from "next-auth";
import styles from './styles.module.css'
import TextArea from "@/components/textArea";
import Head from "next/head";
import { FaShareAlt, FaTrashAlt } from "react-icons/fa";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import React from 'react';
import Link from "next/link";

//firebase imports
import { db } from '../../services/firebaseConnection';
import { collection, addDoc, query, orderBy, where, onSnapshot, doc, deleteDoc } from "firebase/firestore"; 
import AlertBox from "../../components/alert/alert";

interface HomeProps {
  user: {
    email: string;
  }
}

interface TasksProps {
  tarefa: string,
  id: string,
  created: Date,
  public: boolean,
  user: string,
}

export default function Dashboard({ user }: HomeProps) {
  const [input, setInput] = useState('');
  const [publicTask, setPublicTask] = useState(false);
  const [tasks, setTasks] = useState<TasksProps[]>([]);

  function handleChangePublic(event: ChangeEvent<HTMLInputElement>) {
    setPublicTask(event.target.checked);
  }

  async function handleShare(id: string) {
    await navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_URL}/task/${id}`
    );
    alert('Url Copiada');
  }

  async function handleRegisterTask(event: FormEvent) {
    event.preventDefault();
    if (input === '') return;

    try {
      await addDoc(collection(db, 'tarefas'), {
        tarefa: input,
        created: new Date(),
        user: user?.email,
        public: publicTask,
      });

      setInput('');
      setPublicTask(false);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    async function loadedTasks() {
      const taskCollection = collection(db, 'tarefas');
      const q = query(
        taskCollection,
        orderBy('created', 'desc'),
        where('user', '==', user?.email)
      );

      onSnapshot(q, (snapshot) => {
        let lista = [] as TasksProps[];

        snapshot.forEach((doc) => {
          lista.push({
            id: doc.id,
            tarefa: doc.data().tarefa,
            created: doc.data().created,
            user: doc.data().user,
            public: doc.data().public,
          });
        });
        setTasks(lista);
      });
    }
    loadedTasks();
  }, [user]);

  return (
    <>
      <Head>
        <title>Dashboard</title>
      </Head>
      <main>
        <div className={styles.container}>
          <section className={styles.section}>
            <h1 className={styles.title}>Qual sua tarefa?</h1>

            <form className={styles.form} onSubmit={handleRegisterTask}>
              <TextArea 
                message='Digite a tarefa..' 
                rows={5}
                value={input}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value)} 
              />

              <div className={styles.checkBoxArea}>
                <input type='checkbox' 
                  checked={publicTask}
                  onChange={handleChangePublic} 
                />
                <label>Deixar tarefa pública?</label>
              </div>

              <div className={styles.buttonArea}>
                <button type='submit' className={styles.button}>Registrar</button>
              </div>
            </form>
          </section>
        </div>

        {/* Renderizando o componente de tarefas */}
        <YourComponent tasks={tasks} handleShare={handleShare} />
      </main>
    </>
  );
}

// Componente de tarefas
interface YourComponentProps {
  tasks: TasksProps[];
  handleShare: (id: string) => void;
}

const YourComponent: React.FC<YourComponentProps> = ({ tasks, handleShare }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [docIdToDelete, setDocIdToDelete] = useState<string | null>(null);

  const handleDeleteDoc = async (id: string) => {
    await deleteDoc(doc(db, 'tarefas', id));
    setIsDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setDocIdToDelete(id);
    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    if (docIdToDelete) {
      handleDeleteDoc(docIdToDelete);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setDocIdToDelete(null);
  };

  return (
    <section className={styles.taskContainer}>
      <h1>Minhas tarefas</h1>

      {tasks.map((item) => (
        <article id={item.id} className={styles.task} key={item.id}>
          {item.public && (
            <div className={styles.tagContainer}>
              <label className={styles.public}>PÚBLICO</label>
              <button onClick={() => handleShare(item.id)}>
                <FaShareAlt className={styles.shareButton} />
              </button>
            </div>
          )}

          <div className={styles.taskContent}>
            {item.public ? (
              <Link href={`/task/${item.id}`}>
                <p>{item.tarefa}</p>
              </Link>
            ) : (
              <p>{item.tarefa}</p>
            )}

{!isDialogOpen || docIdToDelete !== item.id ? (
              <button onClick={() => handleDeleteClick(item.id)}>
                <FaTrashAlt className={styles.trashButton} />
              </button>
            ) : null}

            {isDialogOpen && docIdToDelete === item.id && (
              <AlertBox
                isOpen={isDialogOpen}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                message="Tem certeza de que deseja excluir esta tarefa?"
              />
            )}
          </div>
        </article>
      ))}
    </section>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session: Session | null = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: {
        email: session?.user?.email
      },
    },
  };
};
