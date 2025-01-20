import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { db } from '@/services/firebaseConnection';
import { where,
    doc,
    collection,
    query,
    getDoc,
    getDocs,
    addDoc,
    orderBy,
    onSnapshot,
    deleteDoc
 } from 'firebase/firestore';
 import styles from './styles.module.css'
import {ChangeEvent, FormEvent, useEffect, useState } from 'react';
import TextArea from '@/components/textArea';
import { useSession } from 'next-auth/react';
import { FaTrash } from 'react-icons/fa';



interface ItemProps {
    item:{
        tarefa: string,
        user: string,
        created: string,
        public: boolean,
        taskId: string,
    }
    allComments: CommentsProps[];
}
interface CommentsProps {
    comment: string,
    user: string,
    created: Date,
    name: string,
    commentId: string,
    id: string,
}
export default function Task({ item, allComments }: ItemProps ){
    
    const {data: session} = useSession();

    const [input, setInput] = useState('');
    const [comments, setComments] = useState<CommentsProps[]>(allComments || []);

    const [showModal, setShowModal] = useState(false);
    const [ commentToDelete, setCommentToDelete] = useState<string | null>(null);



    //register comment function
    async function handleRegisterComments (event: FormEvent){
        event.preventDefault();
        if (input === '') return;

        if (!session?.user?.email || !session?.user?.name) return;
    
        try{
            await addDoc(collection(db, 'comments'),{
                comment: input,
                created: new Date(),
                user: session?.user?.email,
                name: session?.user?.name,
                commentId: item?.taskId,
            });

            const data = {
                comment: input,
                user: session?.user?.email,
                name: session?.user?.name,
                commentId: item?.taskId,
                created: new Date().toISOString(),
                
            }
            
            setComments((oldItems) => [...oldItems, data]);
            setInput('');
        } catch (err) {
            console.error(err);
        }
    }

    const confirmDelete = (id: string) => {
        setShowModal(true)
        setCommentToDelete(id)
    }

    const handleDeleteComment = async () => {
        if (!commentToDelete) return;  // Verifica se há um comentário a ser deletado
    
        try {
            const docRef = doc(db, 'comments', commentToDelete); // Deleta o comentário com o ID armazenado
            await deleteDoc(docRef);
    
            const updatedComments = comments.filter((item) => item.id !== commentToDelete);
            setComments(updatedComments);
        } catch (err) {
            console.error('Erro ao deletar comentário:', err);
        } finally {
            setShowModal(false);      // Fecha o modal
            setCommentToDelete(null); // Limpa o estado
        }
    };
   




    useEffect(() => {
        async function loadedComments() {
            const commentsCollection = collection(db, 'comments');
            const q = query(
                commentsCollection,
                where("commentId", "==", item.taskId),
                orderBy ('created', 'desc')
            );

            onSnapshot(q, (snapshot) => {
                let lista = [] as CommentsProps[];
                snapshot.forEach((doc) => {
                    lista.push({
                        comment: doc.data().comment,
                        user: doc.data().user,
                        created: doc.data().created,
                        name: doc.data().name,
                        commentId: doc.data().commentId,
                        id: doc.id,
                        
                    });
                });
                setComments(lista);
            })
        }
        loadedComments();
    }, [item]);


    return(
        <div className={styles.container}>
            <Head>Descrição task</Head>
            <main className={styles.main}>
                <article className={styles.article}>
                    <div className={styles.itemTarefa}>
                        <p>{item.tarefa}</p>
                        <p style={{ 'fontSize': 'smaller', 'fontStyle': 'italic'}}>{item.created}</p>
                    </div>
                    <p className={styles.user}>usuário: {item.user}</p>
                    <p>{item.public}</p>
                </article>
                <form onSubmit={handleRegisterComments} className={styles.form}>
                    <TextArea
                        message='Comentar sobre a tarefa...'
                        width= {50}
                        rows={5}
                        value={input}
                        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value)}/>

                        <div className={styles.buttonArea}>
                            <button type='submit' className={styles.button}>Comentar</button>
                        </div>
                </form>

                <section className={styles.commentSection}>
                    {comments.length === 0 && (
                        <span style={{'color': 'white'}}>Nenhum comentário...</span>
                    )}
                    <h3>Comentários</h3>
                    {comments.map((comment) => (
                        <article style={{'color': 'white'}} key={comment.id} className={styles.comments}>
                            <div className={styles.comments1}>
                                <span className={styles.user}>{comment.user}</span>
                                <div className={styles.contentComment}>
                                    <p>
                                        {comment.comment}
                                    </p>
                                    {comment.user == session?.user?.email && (
                                        <button onClick={() => confirmDelete(comment.id)}>
                                            <FaTrash/>
                                        </button>
                                    )}
                                </div>
                            </div>


                        </article>
                    ))}


                    {showModal && (
                    <div className="modal">
                        <p>Você tem certeza que deseja excluir este comentário?</p>
                        <button onClick={handleDeleteComment}>Sim</button>
                        <button onClick={() => setShowModal(false)}>Cancelar</button>
                    </div>
                )}
                </section>


            </main>
        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async ({ params })  => {
    const id = params?.id as string;
    const docRef = doc(db, 'tarefas', id);
    const snapshot = await getDoc(docRef)

    const q = query(collection(db, 'comments'), where("commentId", "==", id))
    const commentSnapshot = await getDocs(q)

    let allComments: CommentsProps[] = [];

    commentSnapshot.forEach((doc) => {
        const data = doc.data();
        allComments.push({
            comment: doc.data()?.comment,
            user: doc.data()?.user,
            created: data.created.toDate().toISOString(),
            name: doc.data()?.name,
            commentId: doc.data()?.commentId,
            id: doc.id,
        })

    })
    console.log(allComments)
    
 

    if (snapshot.data() === undefined) {
        return{
            redirect:{
                destination: '/',
                permanent: false,
            }
            
        }
    }

    if (!snapshot.data()?.public) {
        return {
            redirect: {
                destination: 'http://localhost:3000/dashboard',
                permanent: false,
            }
        }
    }

    const milisecond = snapshot.data()?.created?.seconds * 1000;
    
    const task = {
        tarefa: snapshot.data()?.tarefa,
        user: snapshot.data()?.user,
        created: new Date(milisecond).toLocaleDateString(),
        public: snapshot.data()?.public,
        taskId: id,
    }
    console.log(task)



    return {
        props: {
            item: task,
            allComments: allComments,
        }
    }
}