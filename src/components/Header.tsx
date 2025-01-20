import { useSession, signIn, signOut } from 'next-auth/react'
import styles from './styles.module.css'
import Link from 'next/link'

export function Header(){
    const {data: session, status} = useSession();
    return(
        <header className={styles.header}>
            <section className={styles.section}>
                <nav className={styles.nav}>
                    <div className={styles.links}>
                        <Link href='/'>
                            <h1 className={styles.tarefas}>Tarefas<span>+</span></h1>
                        </Link>
                        {session?.user ? (
                            <Link href='/dashboard' className={styles.painel}>
                            Meu Painel
                            </Link>
                        ): null}
                    </div>

                    {status === "loading" ? (
                    <></> )
                    : 
                    session ? (
                    <button className={styles.acesso} onClick={() => signOut()}>Olá {session.user?.name} </button>)
                    :
                    (<button className={styles.acesso} onClick={() => signIn("google")}>    
                        <h1>Acessar</h1>
                    </button>)
                    }

                </nav>

            </section>
        </header>
    )
}