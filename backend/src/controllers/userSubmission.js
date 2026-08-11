const Problem = require("../models/problem");
const Submission = require("../models/submission");
const User = require("../models/user");
const {getLanguageById,submitBatch,submitToken} = require("../utils/problemUtility");
const Contest = require("../models/contest");
const { submissionQueue } = require("../config/submissionQueue");

const submitCode = async (req,res)=>{
   
    try{
      
       const userId = req.result._id;
       const problemId = req.params.id;

       let {code,language, contestId} = req.body;

      if(!userId||!code||!problemId||!language)
        return res.status(400).send("Some field missing");
      

      if(language==='cpp')
        language='c++'
      
    //    Fetch the problem from database
       const problem =  await Problem.findById(problemId);
       
       // Contest logic
       const now = new Date();
       if (contestId) {
           const contest = await Contest.findById(contestId);
           if (!contest) return res.status(404).send("Contest not found");
           
           const contestStart = new Date(contest.startTime);
           const contestEnd = new Date(contestStart.getTime() + contest.duration * 60000);
           
           if (now < contestStart) {
               return res.status(403).send("Contest has not started yet");
           }
           if (now > contestEnd) {
               return res.status(403).send("Contest has ended");
           }
       } else {
           // If no contestId is provided, block if the problem is in ANY active contest
           const activeContests = await Contest.find({
               problems: problemId,
               startTime: { $lte: now }
           });
           
           // Check if any of these contests are still active
           const isProblemInActiveContest = activeContests.some(c => {
               const start = new Date(c.startTime);
               const end = new Date(start.getTime() + c.duration * 60000);
               return now >= start && now <= end;
           });
           
           if (isProblemInActiveContest) {
               return res.status(403).send("This problem is part of an active contest and cannot be attempted in practice mode.");
           }
       }
    
    // Create Submission with pending status
    const submittedResult = await Submission.create({
          userId,
          problemId,
          code,
          language,
          status:'pending',
          testCasesTotal:problem.hiddenTestCases.length,
          contestId: contestId || null
     });

    // Enqueue the job for async execution
    await submissionQueue.add('evaluateCode', { 
        submissionId: submittedResult._id, 
        problemId, 
        userId, 
        code, 
        language,
        contestId 
    });
    
    // Return 202 Accepted immediately
    res.status(202).json({
        submissionId: submittedResult._id,
        status: 'pending'
    });
       
    }
    catch(err){
      res.status(500).send("Internal Server Error "+ err);
    }
}


const runCode = async(req,res)=>{
    
     // 
     try{
      const userId = req.result._id;
      const problemId = req.params.id;

      let {code,language} = req.body;

     if(!userId||!code||!problemId||!language)
       return res.status(400).send("Some field missing");

   //    Fetch the problem from database
      const problem =  await Problem.findById(problemId);
   //    testcases(Hidden)
      if(language==='cpp')
        language='c++'

   //    Judge0 code ko submit karna hai

   const languageId = getLanguageById(language);

   const submissions = problem.visibleTestCases.map((testcase)=>({
       source_code: Buffer.from(code).toString('base64'),
       language_id: languageId,
       stdin: Buffer.from(testcase.input).toString('base64'),
       expected_output: Buffer.from(testcase.output).toString('base64')
   }));


   const submitResult = await submitBatch(submissions, true);
   
   const resultToken = submitResult.map((value)=> value.token);

   const testResult = await submitToken(resultToken, true);

   const decodedTestResults = testResult.map(test => ({
        ...test,
        stdin: test.stdin ? Buffer.from(test.stdin, 'base64').toString('utf8') : null,
        expected_output: test.expected_output ? Buffer.from(test.expected_output, 'base64').toString('utf8') : null,
        stdout: test.stdout ? Buffer.from(test.stdout, 'base64').toString('utf8') : null,
        stderr: test.stderr ? Buffer.from(test.stderr, 'base64').toString('utf8') : null,
        compile_output: test.compile_output ? Buffer.from(test.compile_output, 'base64').toString('utf8') : null
   }));

    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = true;
    let errorMessage = null;

    for(const test of decodedTestResults){
        if(test.status_id==3){
           testCasesPassed++;
           runtime = runtime+parseFloat(test.time || 0)
           memory = Math.max(memory,test.memory || 0);
        }else{
           status = false;
           errorMessage = test.stderr ? test.stderr : (test.compile_output ? test.compile_output : null);
        }
    }

   
  
   res.status(201).json({
    success:status,
    testCases: decodedTestResults,
    runtime,
    memory
   });
      
   }
   catch(err){
     res.status(500).send("Internal Server Error "+ err);
   }
}


module.exports = {submitCode,runCode};



//     language_id: 54,
//     stdin: '2 3',
//     expected_output: '5',
//     stdout: '5',
//     status_id: 3,
//     created_at: '2025-05-12T16:47:37.239Z',
//     finished_at: '2025-05-12T16:47:37.695Z',
//     time: '0.002',
//     memory: 904,
//     stderr: null,
//     token: '611405fa-4f31-44a6-99c8-6f407bc14e73',


// User.findByIdUpdate({
// })

//const user =  User.findById(id)
// user.firstName = "Mohit";
// await user.save();