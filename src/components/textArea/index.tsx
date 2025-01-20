import styles from './styles.module.css'

interface TextAreaProps {
    message: string,
    rows: number,
    [key: string]: any;
}
export default function TextArea({message, rows, ...rest}: TextAreaProps){
    return(
        <textarea  
        className={styles.textArea}  
        placeholder={message} 
        rows={rows}
        {...rest}></textarea>
    )
}