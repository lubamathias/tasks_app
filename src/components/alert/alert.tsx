interface AlertProps {
    message: string,
    onConfirm: () => void,
    onCancel: () => void,
    isOpen: boolean,
}
export default function AlertBox(props: AlertProps){
    if (!props.isOpen) return null
    
    return(
        <div>
            <h2>{props.message}</h2>
            <div>
                <button onClick={props.onConfirm}>Confirma</button>
                <button onClick={props.onCancel}>Cancela</button>
            </div>
        </div>
    )
}