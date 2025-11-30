namespace OthelloApi.Models
{
    public class GameResult<T>
    {
        public bool IsSuccess { get; }
        public T Value { get; }
        public string ErrorMessage { get; }


        public GameResult(bool isSuccess, T value, string error = null, bool showPopup = true)
        {
            IsSuccess = isSuccess;
            Value = value;
            ErrorMessage = error;
        }
    
    public static GameResult<T> Success(T value) => new GameResult<T>(true, value);
    public static GameResult<T> Failure(string error) 
        => new GameResult<T>(false, default, error);
    }
}


