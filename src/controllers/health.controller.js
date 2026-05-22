
let healthController = {
    check: async (req, res, next) => {
        res.status(200).json({
            message: "Server is up and running!"
        })
    },
};

export default healthController;
